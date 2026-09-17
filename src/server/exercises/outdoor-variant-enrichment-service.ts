import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  buildOutdoorVariantPlan,
  isGymBoundEquipment,
  outdoorVariantText,
  type ExerciseEquipmentSnapshot,
} from "./outdoor-variant-enrichment-core";

export interface OutdoorVariantEnrichmentReport {
  readonly scanned: number;
  readonly enriched: number;
  readonly alreadyEnriched: number;
  readonly noGymDependency: number;
  readonly unmappable: number;
  readonly missingDetails: number;
  readonly unmappableExercises: readonly string[];
}

interface ImportedExerciseRow {
  readonly id: string;
  readonly name: string;
  readonly outdoorVariant: string;
  readonly hasDetails: boolean;
}

export async function enrichImportedGymExercisesForOutdoor(
  force = false,
): Promise<OutdoorVariantEnrichmentReport> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
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

    let enriched = 0;
    let alreadyEnriched = 0;
    let noGymDependency = 0;
    let unmappable = 0;
    let missingDetails = 0;
    const unmappableExercises: string[] = [];

    for (const exercise of exercises) {
      if (!exercise.hasDetails) {
        missingDetails += 1;
        continue;
      }
      if (!force && exercise.outdoorVariant.trim()) {
        alreadyEnriched += 1;
        continue;
      }

      const equipmentReader = await connection.runAndReadAll(`
        SELECT eq.id::VARCHAR,COALESCE(eq.seed_key,''),COALESCE(eq.name_de,''),COALESCE(eq.name_en,eq.name_de,''),ee.quantity_required
        FROM exercise_equipment ee
        JOIN equipment eq ON eq.id=ee.equipment_id
        WHERE ee.exercise_id=$exerciseId::UUID
        ORDER BY COALESCE(eq.seed_key,''),eq.id::VARCHAR
      `, { exerciseId: exercise.id });
      const equipment: ExerciseEquipmentSnapshot[] = equipmentReader.getRows().map((row) => ({
        equipmentId: String(row[0]),
        seedKey: String(row[1]),
        nameDe: String(row[2]),
        nameEn: String(row[3]),
        quantityRequired: Math.max(1, Number(row[4] ?? 1)),
      }));

      if (!equipment.some((item) => isGymBoundEquipment(item.seedKey))) {
        noGymDependency += 1;
        continue;
      }

      const plan = buildOutdoorVariantPlan(equipment, catalogue);
      if (!plan.canApply) {
        unmappable += 1;
        unmappableExercises.push(exercise.name);
        continue;
      }

      await connection.run("BEGIN TRANSACTION");
      try {
        await connection.run(
          "DELETE FROM exercise_outdoor_variant_equipment WHERE exercise_id=$exerciseId::UUID",
          { exerciseId: exercise.id },
        );
        for (const item of plan.equipment) {
          await connection.run(`
            INSERT INTO exercise_outdoor_variant_equipment (exercise_id,equipment_id,quantity_required)
            VALUES ($exerciseId::UUID,$equipmentId::UUID,$quantity)
          `, {
            exerciseId: exercise.id,
            equipmentId: item.equipmentId,
            quantity: item.quantityRequired,
          });
        }
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
        await connection.run(
          "UPDATE exercises SET outdoor_suitable=true,updated_at=current_timestamp WHERE id=$exerciseId::UUID",
          { exerciseId: exercise.id },
        );
        await connection.run("COMMIT");
        enriched += 1;
      } catch (error) {
        await connection.run("ROLLBACK");
        throw error;
      }
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
