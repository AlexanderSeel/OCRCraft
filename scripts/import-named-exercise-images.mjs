import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

const IMAGE_PACKAGE_PROVIDER = "OCRCraft named image package";
const IMAGE_PACKAGE_LICENSE = "OCRCraft generated asset";

// Explicit mappings keep filename-to-exercise decisions reviewable. The two
// closest-match entries are portable movement equivalents, not silent imports.
const IMAGE_MAPPINGS = [
  ["01-resistance-band-row.png", { seedKey: "band-row" }],
  ["02-medicine-ball-slam.png", { canonicalName: "medicine ball overhead slam" }],
  ["03-sandbag-romanian-deadlift.png", { canonicalName: "dumbbell romanian deadlift" }],
  ["04-resistance-band-chest-press.png", { canonicalName: "resistance band seated chest press" }],
  ["05-kettlebell-farmer-carry.png", { seedKey: "farmer-carry" }],
  ["06-glute-bridge.png", { seedKey: "glute-bridge" }],
  ["07-plank-shoulder-taps.png", { seedKey: "plank-shoulder-tap" }],
  ["08-box-step-up.png", { seedKey: "box-stepup" }],
  ["09-kettlebell-goblet-squat.png", { seedKey: "kettlebell-goblet-squat" }],
  ["10-resistance-band-wood-chop.png", { seedKey: "band-anti-rotation-press" }],
  ["11-resistance-band-overhead-press.png", { canonicalName: "resistance band seated shoulder press" }],
  ["12-resistance-band-pull-apart.png", { canonicalName: "band reverse fly" }],
  ["13-kettlebell-reverse-lunge.png", { seedKey: "reverse-lunge" }],
  ["14-kettlebell-swing.png", { canonicalName: "kettlebell swing" }],
  ["15-push-up.png", { seedKey: "pushup" }],
  ["16-sandbag-front-carry.png", { seedKey: "sandbag-front-carry" }],
  ["17-side-plank.png", { seedKey: "side-plank" }],
  ["18-dead-bug.png", { seedKey: "dead-bug" }],
  ["19-bird-dog.png", { seedKey: "bird-dog" }],
  ["20-mountain-climber.png", { seedKey: "mountain-climber" }],
];

function argumentValue(name) {
  const prefix = `${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : undefined;
}

function pngMetadata(bytes) {
  if (bytes.length < 24 || bytes.readUInt32BE(0) !== 0x89504e47 || bytes.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("Die Datei ist kein gültiges PNG.");
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function findExercise(connection, selector, fileName) {
  const where = selector.seedKey ? "e.seed_key=$value" : "lower(e.canonical_name)=lower($value)";
  const value = selector.seedKey ?? selector.canonicalName;
  const result = await connection.runAndReadAll(`
    SELECT e.id::VARCHAR,COALESCE(t.name,e.canonical_name),COALESCE(e.seed_key,e.id::VARCHAR)
    FROM exercises e
    LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
    WHERE ${where}
  `, { value });
  if (result.getRows().length !== 1) throw new Error(`${fileName}: Zielübung nicht eindeutig gefunden (${value}).`);
  const row = result.getRows()[0];
  return { id: String(row[0]), name: String(row[1]), key: String(row[2]) };
}

async function main() {
  const sourceRoot = path.resolve(argumentValue("--source") ?? process.env.OCRCRAFT_NAMED_IMAGE_SOURCE ?? path.join(process.cwd(), "named-exercise-images"));
  const packageRoot = (await stat(sourceRoot)).isDirectory() ? sourceRoot : path.dirname(sourceRoot);
  const imageRoot = path.join(process.cwd(), "public", "generated", "exercises");
  const instance = await DuckDBInstance.create(path.join(process.cwd(), "data", "ocrcraft.duckdb"));
  const connection = await instance.connect();
  const imported = [];

  try {
    await connection.run("BEGIN TRANSACTION");
    await connection.run("DELETE FROM exercise_media_assets WHERE source_type='external_reference'");
    await connection.run("DELETE FROM exercise_media_assets WHERE provider=$provider", { provider: IMAGE_PACKAGE_PROVIDER });

    for (const [fileName, selector] of IMAGE_MAPPINGS) {
      const bytes = await readFile(path.join(packageRoot, fileName));
      const metadata = pngMetadata(bytes);
      const exercise = await findExercise(connection, selector, fileName);
      const storageKey = `named/${exercise.key}/${fileName}`;
      const destination = path.join(imageRoot, "named", exercise.key, fileName);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, bytes);
      const sha256 = createHash("sha256").update(bytes).digest("hex");

      await connection.run("UPDATE exercise_media_assets SET is_primary=false,updated_at=current_timestamp WHERE exercise_id=$exerciseId::UUID", { exerciseId: exercise.id });
      await connection.run(`
        INSERT INTO exercise_media_assets (
          id,exercise_id,media_type,source_type,provider,review_status,generation_status,
          storage_provider,storage_key,storage_uri,content_type,width,height,sha256,
          generated_at,license_label,source_reference,usage_note,rights_status,
          consent_required,consent_confirmed,is_primary
        ) VALUES (
          $assetId::UUID,$exerciseId::UUID,'image','club_created',$provider,'approved','generated',
          'filesystem',$storageKey,$storageUri,'image/png',$width,$height,$sha256,
          current_timestamp,$licenseLabel,$sourceReference,$usageNote,'approved',false,true,true
        )
      `, {
        assetId: randomUUID(), exerciseId: exercise.id, provider: IMAGE_PACKAGE_PROVIDER,
        storageKey, storageUri: `/generated/exercises/${storageKey}`, width: metadata.width, height: metadata.height, sha256,
        licenseLabel: IMAGE_PACKAGE_LICENSE, sourceReference: "ocrcraft_exercise_images_named.zip",
        usageNote: "Vom Nutzer bereitgestelltes, generiertes Bild; ersetzt externe Referenzmedien.",
      });
      imported.push(`${fileName} -> ${exercise.name}`);
    }

    await connection.run("COMMIT");
    console.log(JSON.stringify({ sourceRoot, imported: imported.length, mappings: imported, externalReferencesRemoved: true }, null, 2));
  } catch (error) {
    await connection.run("ROLLBACK");
    throw error;
  } finally {
    connection.closeSync();
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
