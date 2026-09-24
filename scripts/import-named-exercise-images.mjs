import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

const IMAGE_PACKAGE_PROVIDER = "OCRCraft named image package";
const IMAGE_PACKAGE_LICENSE = "OCRCraft generated asset";

function argumentValue(name) {
  const prefix = `${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : undefined;
}

function manifestFields(item) {
  const filePath = String(item.filename ?? item.file ?? "");
  return {
    fileName: path.basename(filePath),
    displayName: String(item.display_name ?? item.exercise_name ?? ""),
    sourceBatch: String(item.source_batch ?? item.visual_batch ?? "named-image-package"),
    notes: String(item.notes ?? item.import_note ?? ""),
  };
}

function pngMetadata(bytes) {
  if (bytes.length < 24 || bytes.readUInt32BE(0) !== 0x89504e47 || bytes.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("Die Datei ist kein gültiges PNG.");
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function normalize(value) {
  return value.toLocaleLowerCase("de-DE").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenMatch(label, displayName) {
  const labelTokens = new Set(normalize(label).split(" ").filter(Boolean));
  const displayTokens = normalize(displayName).split(" ").filter(Boolean);
  return displayTokens.length > 0 && displayTokens.every((token) => labelTokens.has(token) || labelTokens.has(token.replace(/s$/, "")));
}

async function loadManifest(packageRoot) {
  return JSON.parse(await readFile(path.join(packageRoot, "import-manifest.json"), "utf8"));
}

async function loadExerciseLabels(connection) {
  const result = await connection.runAndReadAll(`
    SELECT e.id::VARCHAR,e.seed_key,e.canonical_name,COALESCE(t.name,''),COALESCE(a.alias,'')
    FROM exercises e
    LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale IN ('de','en')
    LEFT JOIN exercise_aliases a ON a.exercise_id=e.id
    WHERE e.archived=false
  `);
  const labels = new Map();
  for (const row of result.getRows()) {
    const id = String(row[0]);
    const item = labels.get(id) ?? { id, seedKey: row[1] == null ? null : String(row[1]), canonicalName: String(row[2]), labels: [] };
    item.labels.push(String(row[2]), String(row[3]), String(row[4]));
    labels.set(id, item);
  }
  return [...labels.values()];
}

async function resolveExercise(manifestItem, exercises, licensedExerciseIds) {
  const displayName = manifestItem.display_name ?? manifestItem.exercise_name ?? "";
  if (manifestItem.suggested_seed_key) {
    const exact = exercises.filter((exercise) => exercise.seedKey === manifestItem.suggested_seed_key);
    return exact.length === 1 ? exact[0] : null;
  }
  const matches = exercises.filter((exercise) => exercise.labels.some((label) => tokenMatch(label, displayName)));
  if (matches.length === 1) return matches[0];
  const licensedMatches = matches.filter((exercise) => licensedExerciseIds.has(exercise.id));
  return licensedMatches.length === 1 ? licensedMatches[0] : null;
}

async function main() {
  const sourceRoot = path.resolve(argumentValue("--source") ?? process.env.OCRCRAFT_NAMED_IMAGE_SOURCE ?? path.join(process.cwd(), "named-exercise-images"));
  const sourceReference = argumentValue("--source-reference") ?? process.env.OCRCRAFT_NAMED_IMAGE_SOURCE_REFERENCE ?? "ocrcraft_exercise_images_codex_import.zip";
  const sourceStat = await stat(sourceRoot);
  const hasImagesDirectory = await stat(path.join(sourceRoot, "images")).then(() => true).catch(() => false);
  const packageRoot = sourceStat.isDirectory() ? sourceRoot : path.dirname(sourceRoot);
  if (!hasImagesDirectory) throw new Error(`Erwartet einen Paketordner mit images/: ${packageRoot}`);
  const imageRoot = path.join(process.cwd(), "public", "generated", "exercises");
  const instance = await DuckDBInstance.create(path.join(process.cwd(), "data", "ocrcraft.duckdb"));
  const connection = await instance.connect();
  const imported = [];
  const skipped = [];

  try {
    const manifest = await loadManifest(packageRoot);
    const exercises = await loadExerciseLabels(connection);
    const existingResult = await connection.runAndReadAll(`
      SELECT exercise_id::VARCHAR,storage_key,source_type,review_status,generation_status
      FROM exercise_media_assets
    `);
    const existingKeys = new Set(existingResult.getRows().map((row) => String(row[1] ?? "")));
    const approvedExercises = new Set(existingResult.getRows()
      .filter((row) => String(row[3]) === "approved" && String(row[4]) === "generated" && String(row[2]) !== "external_reference")
      .map((row) => String(row[0])));
    const licensedExerciseIds = new Set(existingResult.getRows()
      .filter((row) => String(row[2]) === "external_reference")
      .map((row) => String(row[0])));

    await connection.run("BEGIN TRANSACTION");
    for (const manifestItem of manifest) {
      const fields = manifestFields(manifestItem);
      const exercise = await resolveExercise(manifestItem, exercises, licensedExerciseIds);
      if (!exercise) {
        skipped.push({ fileName: fields.fileName, reason: "ambiguous-or-unmatched", displayName: fields.displayName });
        continue;
      }
      const storageKey = `named/${exercise.seedKey ?? exercise.id}/${fields.fileName}`;
      if (existingKeys.has(storageKey)) {
        skipped.push({ fileName: fields.fileName, reason: "already-imported", exercise: exercise.seedKey ?? exercise.id });
        continue;
      }
      if (approvedExercises.has(exercise.id)) {
        skipped.push({ fileName: fields.fileName, reason: "approved-media-preserved", exercise: exercise.seedKey ?? exercise.id });
        continue;
      }

      const bytes = await readFile(path.join(packageRoot, "images", fields.fileName));
      const metadata = pngMetadata(bytes);
      const destination = path.join(imageRoot, "named", exercise.seedKey ?? exercise.id, fields.fileName);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, bytes);
      const sha256 = createHash("sha256").update(bytes).digest("hex");

      await connection.run(`
        INSERT INTO exercise_media_assets (
          id,exercise_id,media_type,source_type,provider,review_status,generation_status,
          storage_provider,storage_key,storage_uri,content_type,width,height,sha256,
          generated_at,license_label,source_reference,usage_note,rights_status,
          consent_required,consent_confirmed,is_primary
        ) VALUES (
          $assetId::UUID,$exerciseId::UUID,'image','club_created',$provider,'pending','generated',
          'filesystem',$storageKey,$storageUri,'image/png',$width,$height,$sha256,
          current_timestamp,$licenseLabel,$sourceReference,$usageNote,'approved',false,true,false
        )
      `, {
        assetId: randomUUID(), exerciseId: exercise.id, provider: IMAGE_PACKAGE_PROVIDER,
        storageKey, storageUri: `/generated/exercises/${storageKey}`, width: metadata.width, height: metadata.height, sha256,
        licenseLabel: IMAGE_PACKAGE_LICENSE, sourceReference,
        usageNote: `${fields.sourceBatch}: ${fields.notes}`,
      });
      existingKeys.add(storageKey);
      imported.push({ fileName: fields.fileName, exercise: exercise.seedKey ?? exercise.canonicalName });
    }
    await connection.run("COMMIT");
    console.log(JSON.stringify({ sourceRoot, imported: imported.length, skipped: skipped.length, mappings: imported, skippedItems: skipped }, null, 2));
  } catch (error) {
    await connection.run("ROLLBACK");
    throw error;
  } finally {
    connection.closeSync();
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
