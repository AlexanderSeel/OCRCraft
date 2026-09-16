import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { refreshExerciseSearchDocuments } from "@/server/search/exercise-search-documents";
import { replaceExerciseFacetMappings } from "./exercise-facet-core";

export type BodyRegionEmphasis = "primary" | "secondary";

export interface ExerciseFacetOption {
  readonly id: string;
  readonly labelDe: string;
  readonly labelEn: string;
}

export interface ExerciseEquipmentOption extends ExerciseFacetOption {
  readonly quantityAvailable: number | null;
}

export interface ExerciseBodyRegionSelection {
  readonly id: string;
  readonly emphasis: BodyRegionEmphasis;
}

export interface ExerciseEquipmentSelection {
  readonly id: string;
  readonly quantityRequired: number;
}

export interface ExerciseFacetSelection {
  readonly bodyRegions: readonly ExerciseBodyRegionSelection[];
  readonly movementPatternIds: readonly string[];
  readonly tagIds: readonly string[];
  readonly equipment: readonly ExerciseEquipmentSelection[];
}

export interface ExerciseFacetEditorData {
  readonly bodyRegions: readonly ExerciseFacetOption[];
  readonly movementPatterns: readonly ExerciseFacetOption[];
  readonly tags: readonly ExerciseFacetOption[];
  readonly equipment: readonly ExerciseEquipmentOption[];
  readonly selected: ExerciseFacetSelection;
}

export type UpdateExerciseFacetsInput = ExerciseFacetSelection;

function rowsToOptions(rows: readonly (readonly unknown[])[]): readonly ExerciseFacetOption[] {
  return rows.map((row) => ({
    id: String(row[0]),
    labelDe: String(row[1]),
    labelEn: String(row[2]),
  }));
}

export async function listBodyRegionOptions(): Promise<readonly ExerciseFacetOption[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      "SELECT id,label_de,label_en FROM body_regions ORDER BY label_de",
    );
    return rowsToOptions(reader.getRows());
  });
}

export async function getExerciseFacetEditorData(
  exerciseId: string,
): Promise<ExerciseFacetEditorData> {
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const bodyReader = await connection.runAndReadAll(
      "SELECT id,label_de,label_en FROM body_regions ORDER BY label_de",
    );
    const movementReader = await connection.runAndReadAll(
      "SELECT id,label_de,label_en FROM movement_patterns ORDER BY label_de",
    );
    const tagReader = await connection.runAndReadAll(
      "SELECT id,label_de,label_en FROM tags ORDER BY label_de",
    );
    const equipmentReader = await connection.runAndReadAll(
      "SELECT id::VARCHAR,name_de,COALESCE(name_en,name_de),quantity_available FROM equipment WHERE archived=false ORDER BY name_de",
    );
    const selectedBodyReader = await connection.runAndReadAll(
      "SELECT body_region_id,emphasis FROM exercise_body_regions WHERE exercise_id=$exerciseId::UUID ORDER BY body_region_id",
      { exerciseId },
    );
    const selectedMovementReader = await connection.runAndReadAll(
      "SELECT movement_pattern_id FROM exercise_movement_patterns WHERE exercise_id=$exerciseId::UUID ORDER BY movement_pattern_id",
      { exerciseId },
    );
    const selectedTagReader = await connection.runAndReadAll(
      "SELECT tag_id FROM exercise_tags WHERE exercise_id=$exerciseId::UUID ORDER BY tag_id",
      { exerciseId },
    );
    const selectedEquipmentReader = await connection.runAndReadAll(
      "SELECT equipment_id::VARCHAR,quantity_required FROM exercise_equipment WHERE exercise_id=$exerciseId::UUID ORDER BY equipment_id",
      { exerciseId },
    );

    return {
      bodyRegions: rowsToOptions(bodyReader.getRows()),
      movementPatterns: rowsToOptions(movementReader.getRows()),
      tags: rowsToOptions(tagReader.getRows()),
      equipment: equipmentReader.getRows().map((row) => ({
        id: String(row[0]),
        labelDe: String(row[1]),
        labelEn: String(row[2]),
        quantityAvailable: row[3] == null ? null : Number(row[3]),
      })),
      selected: {
        bodyRegions: selectedBodyReader.getRows().map((row) => ({
          id: String(row[0]),
          emphasis: String(row[1]) as BodyRegionEmphasis,
        })),
        movementPatternIds: selectedMovementReader.getRows().map((row) => String(row[0])),
        tagIds: selectedTagReader.getRows().map((row) => String(row[0])),
        equipment: selectedEquipmentReader.getRows().map((row) => ({
          id: String(row[0]),
          quantityRequired: Number(row[1]),
        })),
      },
    };
  });
}

export async function updateExerciseFacets(
  exerciseId: string,
  input: UpdateExerciseFacetsInput,
): Promise<void> {
  await ensureDatabaseReady();

  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const exerciseReader = await connection.runAndReadAll(
        "SELECT id::VARCHAR FROM exercises WHERE id=$exerciseId::UUID",
        { exerciseId },
      );
      if (exerciseReader.getRows().length === 0) {
        throw new Error("Übung wurde nicht gefunden.");
      }

      await replaceExerciseFacetMappings(connection, exerciseId, input);
      await connection.run(
        "UPDATE exercises SET updated_at=current_timestamp WHERE id=$exerciseId::UUID",
        { exerciseId },
      );
      await refreshExerciseSearchDocuments(connection, "de");
      await refreshExerciseSearchDocuments(connection, "en");
      await connection.run(
        "UPDATE search_index_state SET status='dirty', last_error=NULL WHERE locale IN ('de','en')",
      );
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}
