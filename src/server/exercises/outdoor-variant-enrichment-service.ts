import "server-only";

import type { DuckDBConnection } from "@duckdb/node-api";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  buildOutdoorVariantPlan,
  isGymBoundEquipment,
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
  readonly unmappableExercises: readonly string[];
}

export type OutdoorVariantCandidateStatus =
  | "ready"
  | "existing"
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
}

interface ImportedExerciseRow {
  readonly id: string;
  readonly name: string;
  readonly outdoorVariant: string;
  readonly hasDetails: boolean;
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
    SELECT e.id::VARCHAR,COALESCE(t.name,e.canonical_name),COALESCE(d.outdoor_variant,''),d.exercise_id IS NOT NULL
    FROM exercises e
    LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
    LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale='de'
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
  const status: OutdoorVariantCandidateStatus = existing
    ? "existing"
    : plan.canApply
      ? "ready"
      : "unmappable";

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
    variantText: existing ? exercise.outdoorVariant : outdoorVariantText(plan, "de"),
  };
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
      if (!equipment.some((item) => isGymBoundEquipment(item.seedKey))) continue;

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
        });
        continue;
      }

      previews.push(previewFromPlan(exercise, equipment, buildOutdoorVariantPlan(equipment, catalogue)));
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
      de: outdoorVariantText(plan, "de"),
      en: outdoorVariantText(plan, "en"),
    });
    await setOutdoorSuitability(connection, exercise.id, true);
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
  exerciseId: string,
  plan: OutdoorVariantPlan,
): Promise<void> {
  await connection.run("BEGIN TRANSACTION");
  try {
    await writeOutdoorEquipment(connection, exerciseId, plan);
    await setOutdoorSuitability(connection, exerciseId, true);
    await connection.run("COMMIT");
  } catch (error) {
    await connection.run("ROLLBACK");
    throw error;
  }
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
export async function enrichImportedGymExerciseForOutdoor(exerciseId: string): Promise<"enriched" | "existing" | "unmappable" | "missing-details" | "not-found"> {
  if (!UUID_PATTERN.test(exerciseId)) return "not-found";
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const { catalogue, exercises } = await loadScanContext(connection);
    const exercise = exercises.find((item) => item.id === exerciseId);
    if (!exercise) return "not-found";

    const equipment = await loadExerciseEquipment(connection, exercise.id);
    if (!equipment.some((item) => isGymBoundEquipment(item.seedKey))) return "not-found";
    if (!exercise.hasDetails) {
      await setOutdoorSuitability(connection, exercise.id, false);
      return "missing-details";
    }

    const plan = buildOutdoorVariantPlan(equipment, catalogue);
    if (exercise.outdoorVariant.trim()) {
      if (!plan.canApply) {
        await markOutdoorPlanUnmappable(connection, exercise.id);
        return "unmappable";
      }
      await hydrateExistingOutdoorVariantEquipment(connection, exercise.id, plan);
      return "existing";
    }
    if (!plan.canApply) {
      await markOutdoorPlanUnmappable(connection, exercise.id);
      return "unmappable";
    }

    await applyOutdoorPlan(connection, exercise, plan);
    return "enriched";
  });
}

export async function enrichImportedGymExercisesForOutdoor(
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
    const unmappableExercises: string[] = [];

    for (const exercise of exercises) {
      const equipment = await loadExerciseEquipment(connection, exercise.id);
      const hasGymDependency = equipment.some((item) => isGymBoundEquipment(item.seedKey));

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
        await hydrateExistingOutdoorVariantEquipment(connection, exercise.id, plan);
        alreadyEnriched += 1;
        continue;
      }

      if (!plan.canApply) {
        await markOutdoorPlanUnmappable(connection, exercise.id);
        unmappable += 1;
        unmappableExercises.push(exercise.name);
        continue;
      }

      await applyOutdoorPlan(connection, exercise, plan);
      enriched += 1;
    }

    return {
      scanned: exercises.length,
      enriched,
      alreadyEnriched,
      noGymDependency,
      unmappable,
      missingDetails,
      unmappableExercises,
    };
  });
}
