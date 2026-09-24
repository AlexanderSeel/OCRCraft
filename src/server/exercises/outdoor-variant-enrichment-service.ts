import "server-only";

import type { DuckDBConnection } from "@duckdb/node-api";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  buildOutdoorVariantPlan,
  buildPreconvertedOutdoorVariantPlan,
  inferOutdoorMovementFamily,
  isGymBoundEquipment,
  isSystemGeneratedOutdoorVariant,
  outdoorVariantText,
  type ExerciseEquipmentSnapshot,
  type OutdoorVariantPlan,
} from "./outdoor-variant-enrichment-core";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface OutdoorVariantEnrichmentReport {
  readonly scanned: number;
  readonly enriched: number;
  readonly alreadyEnriched: number;
  readonly noGymDependency: number;
  readonly unmappable: number;
  readonly missingDetails: number;
  readonly manualReviewRequired: number;
  readonly unmappableExercises: readonly string[];
}

export type OutdoorVariantCandidateStatus =
  | "ready"
  | "existing"
  | "review-required"
  | "unmappable"
  | "missing-details";

export interface OutdoorVariantCandidatePreview {
  readonly exerciseId: string;
  readonly name: string;
  readonly status: OutdoorVariantCandidateStatus;
  readonly originalEquipment: readonly string[];
  readonly outdoorEquipment: readonly string[];
  readonly substitutions: readonly string[];
  readonly missingReplacements: readonly string[];
  readonly variantText: string;
  readonly movementFamily: ReturnType<typeof inferOutdoorMovementFamily>;
}

export interface PortabilityAuditSummary {
  readonly total: number;
  readonly portable: number;
  readonly converted: number;
  readonly blocked: number;
  readonly pending: number;
  readonly latestReviewAt: string | null;
}

export interface PortabilityAuditEntry {
  readonly exerciseId: string;
  readonly name: string;
  readonly disposition: "portable" | "converted" | "blocked";
  readonly reason: string;
  readonly replacementEquipment: string;
  readonly sources: string;
  readonly reviewStatus: string;
  readonly reviewedAt: string;
  readonly reviewerName: string | null;
}

export interface PortabilityAuditOverview {
  readonly summary: PortabilityAuditSummary;
  readonly entries: readonly PortabilityAuditEntry[];
}

interface ImportedExerciseRow {
  readonly id: string;
  readonly name: string;
  readonly outdoorVariant: string;
  readonly hasDetails: boolean;
  readonly environmentDisposition: string;
  readonly environmentReviewStatus: string;
  readonly movementPatterns: readonly string[];
}

interface OutdoorVariantScanContext {
  readonly catalogue: readonly ExerciseEquipmentSnapshot[];
  readonly exercises: readonly ImportedExerciseRow[];
}

async function loadScanContext(connection: DuckDBConnection): Promise<OutdoorVariantScanContext> {
  const catalogueReader = await connection.runAndReadAll(`
    SELECT id::VARCHAR,COALESCE(seed_key,''),COALESCE(name_de,''),COALESCE(name_en,name_de,'')
    FROM equipment
    WHERE COALESCE(seed_key,'')<>''
    ORDER BY seed_key
  `);
  const catalogue: ExerciseEquipmentSnapshot[] = catalogueReader.getRows().map((row) => ({
    equipmentId: String(row[0]),
    seedKey: String(row[1]),
    nameDe: String(row[2]),
    nameEn: String(row[3]),
    quantityRequired: 1,
  }));

  const exerciseReader = await connection.runAndReadAll(`
    SELECT
      e.id::VARCHAR,
      COALESCE(t.name,e.canonical_name),
      COALESCE(d.outdoor_variant,''),
      d.exercise_id IS NOT NULL,
      COALESCE(r.disposition,''),
      COALESCE(r.review_status,'catalog'),
      COALESCE((
        SELECT string_agg(mp.movement_pattern_id, ',' ORDER BY mp.movement_pattern_id)
        FROM exercise_movement_patterns mp
        WHERE mp.exercise_id=e.id
      ), '')
    FROM exercises e
    LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
    LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de'
    LEFT JOIN exercise_environment_reviews r ON r.exercise_id=e.id
    WHERE e.archived=false AND (
      COALESCE(e.seed_key,'') LIKE 'imported-%'
      OR EXISTS (
        SELECT 1 FROM exercise_source_references sr
        WHERE sr.exercise_id=e.id AND sr.source_type='dataset'
      )
    )
    ORDER BY COALESCE(t.name,e.canonical_name)
  `);
  const exercises: ImportedExerciseRow[] = exerciseReader.getRows().map((row) => ({
    id: String(row[0]),
    name: String(row[1]),
    outdoorVariant: String(row[2] ?? ""),
    hasDetails: Boolean(row[3]),
    environmentDisposition: String(row[4] ?? ""),
    environmentReviewStatus: String(row[5] ?? "catalog"),
    movementPatterns: String(row[6] ?? "").split(",").map((item) => item.trim()).filter(Boolean),
  }));

  return { catalogue, exercises };
}

async function loadExerciseEquipment(
  connection: DuckDBConnection,
  exerciseId: string,
): Promise<readonly ExerciseEquipmentSnapshot[]> {
  const equipmentReader = await connection.runAndReadAll(`
    SELECT eq.id::VARCHAR,COALESCE(eq.seed_key,''),COALESCE(eq.name_de,''),COALESCE(eq.name_en,eq.name_de,''),ee.quantity_required
    FROM exercise_equipment ee
    JOIN equipment eq ON eq.id=ee.equipment_id
    WHERE ee.exercise_id=$exerciseId::UUID
    ORDER BY COALESCE(eq.seed_key,''),eq.id::VARCHAR
  `, { exerciseId });

  return equipmentReader.getRows().map((row) => ({
    equipmentId: String(row[0]),
    seedKey: String(row[1]),
    nameDe: String(row[2]),
    nameEn: String(row[3]),
    quantityRequired: Math.max(1, Number(row[4] ?? 1)),
  }));
}

function equipmentLabel(item: ExerciseEquipmentSnapshot): string {
  return `${item.quantityRequired} × ${item.nameDe || item.seedKey}`;
}

function previewFromPlan(
  exercise: ImportedExerciseRow,
  equipment: readonly ExerciseEquipmentSnapshot[],
  plan: OutdoorVariantPlan,
): OutdoorVariantCandidatePreview {
  const existing = exercise.outdoorVariant.trim().length > 0;
  const systemGenerated = isSystemGeneratedOutdoorVariant(exercise.outdoorVariant);
  const pendingReview = exercise.environmentDisposition === "converted"
    && exercise.environmentReviewStatus === "pending";
  const status: OutdoorVariantCandidateStatus = !plan.canApply
    ? "unmappable"
    : pendingReview
      ? "review-required"
      : existing && !systemGenerated
        ? "existing"
        : "ready";
  const movementContext = { name: exercise.name, movementPatterns: exercise.movementPatterns };

  return {
    exerciseId: exercise.id,
    name: exercise.name,
    status,
    originalEquipment: equipment.map(equipmentLabel),
    outdoorEquipment: plan.equipment.map(equipmentLabel),
    substitutions: plan.substitutions.flatMap(({ original, replacement }) =>
      replacement ? [`${original.nameDe || original.seedKey} → ${replacement.nameDe || replacement.seedKey}`] : []
    ),
    missingReplacements: plan.substitutions.flatMap(({ original, replacement }) =>
      replacement ? [] : [original.nameDe || original.seedKey]
    ),
    variantText: existing && !systemGenerated
      ? exercise.outdoorVariant
      : outdoorVariantText(plan, "de", movementContext),
    movementFamily: inferOutdoorMovementFamily(movementContext),
  };
}

export async function getPortabilityAuditOverview(limit = 30): Promise<PortabilityAuditOverview> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const summaryReader = await connection.runAndReadAll(`
      SELECT
        count(*),
        count(*) FILTER (WHERE disposition='portable'),
        count(*) FILTER (WHERE disposition='converted'),
        count(*) FILTER (WHERE disposition='blocked'),
        count(*) FILTER (WHERE COALESCE(review_status,'catalog')='pending'),
        max(reviewed_at)::VARCHAR
      FROM exercise_environment_reviews
    `);
    const summaryRow = summaryReader.getRows()[0] ?? [];

    const entryReader = await connection.runAndReadAll(`
      SELECT
        r.exercise_id::VARCHAR,
        COALESCE(t.name,e.canonical_name),
        r.disposition,
        r.reason,
        COALESCE(r.replacement_equipment,''),
        COALESCE((
          SELECT string_agg(source.provider, ', ' ORDER BY source.provider)
          FROM (
            SELECT DISTINCT sr.provider
            FROM exercise_source_references sr
            WHERE sr.exercise_id=e.id
          ) source
        ), CASE WHEN e.seed_key IS NOT NULL THEN 'ocrcraft-seed' ELSE 'unbekannt' END),
        COALESCE(r.review_status,'catalog'),
        r.reviewed_at::VARCHAR,
        (
          SELECT u.display_name
          FROM app_users u
          WHERE u.id=r.reviewed_by
          LIMIT 1
        )
      FROM exercise_environment_reviews r
      JOIN exercises e ON e.id=r.exercise_id
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
      ORDER BY
        CASE COALESCE(r.review_status,'catalog') WHEN 'pending' THEN 0 ELSE 1 END,
        r.reviewed_at DESC,
        COALESCE(t.name,e.canonical_name)
      LIMIT $limit
    `, { limit: Math.max(1, Math.min(100, Math.trunc(limit))) });

    return {
      summary: {
        total: Number(summaryRow[0] ?? 0),
        portable: Number(summaryRow[1] ?? 0),
        converted: Number(summaryRow[2] ?? 0),
        blocked: Number(summaryRow[3] ?? 0),
        pending: Number(summaryRow[4] ?? 0),
        latestReviewAt: summaryRow[5] == null ? null : String(summaryRow[5]),
      },
      entries: entryReader.getRows().map((row) => ({
        exerciseId: String(row[0]),
        name: String(row[1]),
        disposition: String(row[2]) as PortabilityAuditEntry["disposition"],
        reason: String(row[3]),
        replacementEquipment: String(row[4] ?? ""),
        sources: String(row[5] ?? "unbekannt"),
        reviewStatus: String(row[6] ?? "catalog"),
        reviewedAt: String(row[7]),
        reviewerName: row[8] == null ? null : String(row[8]),
      })),
    };
  });
}

/**
 * Read-only preview used by the admin review surface. Exercises without any
 * gym-bound equipment are intentionally omitted so the list stays focused on
 * records that can actually change.
 */
export async function listOutdoorVariantCandidates(): Promise<readonly OutdoorVariantCandidatePreview[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const { catalogue, exercises } = await loadScanContext(connection);
    const previews: OutdoorVariantCandidatePreview[] = [];

    for (const exercise of exercises) {
      const equipment = await loadExerciseEquipment(connection, exercise.id);
      const hasGymDependency = equipment.some((item) => isGymBoundEquipment(item.seedKey));
      const pendingConvertedReview = exercise.environmentDisposition === "converted"
        && exercise.environmentReviewStatus === "pending";
      if (!hasGymDependency && !pendingConvertedReview) continue;

      if (!exercise.hasDetails) {
        previews.push({
          exerciseId: exercise.id,
          name: exercise.name,
          status: "missing-details",
          originalEquipment: equipment.map(equipmentLabel),
          outdoorEquipment: [],
          substitutions: [],
          missingReplacements: [],
          variantText: "",
          movementFamily: inferOutdoorMovementFamily({ name: exercise.name, movementPatterns: exercise.movementPatterns }),
        });
        continue;
      }

      const plan = pendingConvertedReview && !hasGymDependency
        ? buildPreconvertedOutdoorVariantPlan(equipment)
        : buildOutdoorVariantPlan(equipment, catalogue);
      previews.push(previewFromPlan(exercise, equipment, plan));
    }

    return previews;
  });
}

async function setOutdoorSuitability(
  connection: DuckDBConnection,
  exerciseId: string,
  suitable: boolean,
): Promise<void> {
  await connection.run(
    "UPDATE exercises SET outdoor_suitable=$suitable,updated_at=current_timestamp WHERE id=$exerciseId::UUID",
    { exerciseId, suitable },
  );
}

async function clearOutdoorVariantEquipment(connection: DuckDBConnection, exerciseId: string): Promise<void> {
  await connection.run(
    "DELETE FROM exercise_outdoor_variant_equipment WHERE exercise_id=$exerciseId::UUID",
    { exerciseId },
  );
}

async function writeOutdoorEquipment(
  connection: DuckDBConnection,
  exerciseId: string,
  plan: OutdoorVariantPlan,
): Promise<void> {
  await clearOutdoorVariantEquipment(connection, exerciseId);
  for (const item of plan.equipment) {
    await connection.run(`
      INSERT INTO exercise_outdoor_variant_equipment (exercise_id,equipment_id,quantity_required)
      VALUES ($exerciseId::UUID,$equipmentId::UUID,$quantity)
    `, {
      exerciseId,
      equipmentId: item.equipmentId,
      quantity: item.quantityRequired,
    });
  }
}

async function applyOutdoorPlan(
  connection: DuckDBConnection,
  exercise: ImportedExerciseRow,
  plan: OutdoorVariantPlan,
  reviewedBy: string | null,
): Promise<void> {
  await connection.run("BEGIN TRANSACTION");
  try {
    await writeOutdoorEquipment(connection, exercise.id, plan);
    await connection.run(`
      UPDATE exercise_details
      SET outdoor_variant=CASE locale
        WHEN 'de' THEN $de
        ELSE $en
      END
      WHERE exercise_id=$exerciseId::UUID AND locale IN ('de','en')
    `, {
      exerciseId: exercise.id,
      de: outdoorVariantText(plan, "de", { name: exercise.name, movementPatterns: exercise.movementPatterns }),
      en: outdoorVariantText(plan, "en", { name: exercise.name, movementPatterns: exercise.movementPatterns }),
    });
    await setOutdoorSuitability(connection, exercise.id, true);
    await recordEnvironmentReview(connection, exercise, plan, reviewedBy);
    await connection.run("COMMIT");
  } catch (error) {
    await connection.run("ROLLBACK");
    throw error;
  }
}

/**
 * Keeps trainer-authored variant text untouched while making the structured
 * replacement equipment usable by outdoor candidate selection and logistics.
 */
async function hydrateExistingOutdoorVariantEquipment(
  connection: DuckDBConnection,
  exercise: ImportedExerciseRow,
  plan: OutdoorVariantPlan,
  reviewedBy: string | null,
): Promise<void> {
  await connection.run("BEGIN TRANSACTION");
  try {
    await writeOutdoorEquipment(connection, exercise.id, plan);
    await setOutdoorSuitability(connection, exercise.id, true);
    await recordEnvironmentReview(connection, exercise, plan, reviewedBy);
    await connection.run("COMMIT");
  } catch (error) {
    await connection.run("ROLLBACK");
    throw error;
  }
}

async function recordEnvironmentReview(
  connection: DuckDBConnection,
  exercise: ImportedExerciseRow,
  plan: OutdoorVariantPlan,
  reviewedBy: string | null,
): Promise<void> {
  const movementFamily = inferOutdoorMovementFamily({
    name: exercise.name,
    movementPatterns: exercise.movementPatterns,
  });
  const replacementEquipment = plan.equipment.map((item) => item.seedKey).filter(Boolean).sort().join(", ");
  await connection.run(`
    INSERT OR REPLACE INTO exercise_environment_reviews (
      exercise_id,disposition,reason,replacement_equipment,reviewed_at,review_status,reviewed_by
    ) VALUES (
      $exerciseId::UUID,'converted',$reason,$replacementEquipment,current_timestamp,'approved',$reviewedBy::UUID
    )
  `, {
    exerciseId: exercise.id,
    reason: `Bewegungsspezifische Outdoor-Variante fachlich geprüft (${movementFamily}); nur explizit freigegebenes Ersatz-Equipment wird verwendet.`,
    replacementEquipment,
    reviewedBy,
  });
}

async function markOutdoorPlanUnmappable(connection: DuckDBConnection, exerciseId: string): Promise<void> {
  await connection.run("BEGIN TRANSACTION");
  try {
    await clearOutdoorVariantEquipment(connection, exerciseId);
    await setOutdoorSuitability(connection, exerciseId, false);
    await connection.run("COMMIT");
  } catch (error) {
    await connection.run("ROLLBACK");
    throw error;
  }
}

/** Applies one reviewed candidate only. Existing manual variant text is never overwritten. */
export async function enrichImportedGymExerciseForOutdoor(
  exerciseId: string,
  reviewedBy: string | null = null,
): Promise<"enriched" | "existing" | "unmappable" | "missing-details" | "not-found"> {
  if (!UUID_PATTERN.test(exerciseId)) return "not-found";
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const { catalogue, exercises } = await loadScanContext(connection);
    const exercise = exercises.find((item) => item.id === exerciseId);
    if (!exercise) return "not-found";

    const equipment = await loadExerciseEquipment(connection, exercise.id);
    const hasGymDependency = equipment.some((item) => isGymBoundEquipment(item.seedKey));
    const pendingConvertedReview = exercise.environmentDisposition === "converted"
      && exercise.environmentReviewStatus === "pending";
    if (!hasGymDependency && !pendingConvertedReview) return "not-found";
    if (!exercise.hasDetails) {
      await setOutdoorSuitability(connection, exercise.id, false);
      return "missing-details";
    }

    const plan = pendingConvertedReview && !hasGymDependency
      ? buildPreconvertedOutdoorVariantPlan(equipment)
      : buildOutdoorVariantPlan(equipment, catalogue);
    const hasTrainerText = exercise.outdoorVariant.trim().length > 0
      && !isSystemGeneratedOutdoorVariant(exercise.outdoorVariant);
    if (hasTrainerText) {
      if (!plan.canApply) {
        await markOutdoorPlanUnmappable(connection, exercise.id);
        return "unmappable";
      }
      await hydrateExistingOutdoorVariantEquipment(connection, exercise, plan, reviewedBy);
      return "existing";
    }
    if (!plan.canApply) {
      await markOutdoorPlanUnmappable(connection, exercise.id);
      return "unmappable";
    }

    await applyOutdoorPlan(connection, exercise, plan, reviewedBy);
    return "enriched";
  });
}

export async function enrichImportedGymExercisesForOutdoor(
  reviewedBy: string | null = null,
  force = false,
): Promise<OutdoorVariantEnrichmentReport> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const { catalogue, exercises } = await loadScanContext(connection);

    let enriched = 0;
    let alreadyEnriched = 0;
    let noGymDependency = 0;
    let unmappable = 0;
    let missingDetails = 0;
    let manualReviewRequired = 0;
    const unmappableExercises: string[] = [];

    for (const exercise of exercises) {
      const equipment = await loadExerciseEquipment(connection, exercise.id);
      const hasGymDependency = equipment.some((item) => isGymBoundEquipment(item.seedKey));
      const pendingConvertedReview = exercise.environmentDisposition === "converted"
        && exercise.environmentReviewStatus === "pending";

      if (pendingConvertedReview) {
        manualReviewRequired += 1;
        continue;
      }

      if (!hasGymDependency) {
        noGymDependency += 1;
        continue;
      }

      if (!exercise.hasDetails) {
        await setOutdoorSuitability(connection, exercise.id, false);
        missingDetails += 1;
        continue;
      }

      const plan = buildOutdoorVariantPlan(equipment, catalogue);

      // Existing trainer-authored text is preserved by default, but its
      // structured replacement equipment is refreshed so outdoor planning does
      // not silently fall back to the original studio equipment.
      if (!force && exercise.outdoorVariant.trim() && plan.canApply) {
        await hydrateExistingOutdoorVariantEquipment(connection, exercise, plan, reviewedBy);
        alreadyEnriched += 1;
        continue;
      }

      if (!plan.canApply) {
        await markOutdoorPlanUnmappable(connection, exercise.id);
        unmappable += 1;
        unmappableExercises.push(exercise.name);
        continue;
      }

      await applyOutdoorPlan(connection, exercise, plan, reviewedBy);
      enriched += 1;
    }

    return {
      scanned: exercises.length,
      enriched,
      alreadyEnriched,
      noGymDependency,
      unmappable,
      missingDetails,
      manualReviewRequired,
      unmappableExercises,
    };
  });
}
