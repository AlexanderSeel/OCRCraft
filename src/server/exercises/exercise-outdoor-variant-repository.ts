import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { refreshExerciseSearchDocuments } from "@/server/search/exercise-search-documents";

export interface OutdoorVariantEquipmentOption {
  readonly id: string;
  readonly seedKey: string | null;
  readonly labelDe: string;
  readonly labelEn: string;
  readonly quantityAvailable: number | null;
}

export interface OutdoorVariantEquipmentSelection {
  readonly id: string;
  readonly quantityRequired: number;
}

export interface ExerciseOutdoorVariantEditorData {
  readonly enabled: boolean;
  readonly textDe: string;
  readonly textEn: string;
  readonly equipment: readonly OutdoorVariantEquipmentOption[];
  readonly selectedEquipment: readonly OutdoorVariantEquipmentSelection[];
}

export interface UpdateExerciseOutdoorVariantInput {
  readonly enabled: boolean;
  readonly textDe: string;
  readonly textEn: string;
  readonly equipment: readonly OutdoorVariantEquipmentSelection[];
}

export async function getExerciseOutdoorVariantEditorData(
  exerciseId: string,
): Promise<ExerciseOutdoorVariantEditorData> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const exerciseReader = await connection.runAndReadAll(
      "SELECT COALESCE(outdoor_suitable,true) FROM exercises WHERE id=$exerciseId::UUID",
      { exerciseId },
    );
    if (exerciseReader.getRows().length === 0) throw new Error("Übung wurde nicht gefunden.");

    const detailsReader = await connection.runAndReadAll(`
      SELECT locale,COALESCE(outdoor_variant,'')
      FROM exercise_details
      WHERE exercise_id=$exerciseId::UUID AND locale IN ('de','en')
    `, { exerciseId });
    const textByLocale = new Map(detailsReader.getRows().map((row) => [String(row[0]), String(row[1] ?? "")]));

    const equipmentReader = await connection.runAndReadAll(`
      SELECT id::VARCHAR,seed_key,name_de,COALESCE(name_en,name_de),quantity_available
      FROM equipment
      WHERE archived=false
      ORDER BY name_de
    `);
    const selectedReader = await connection.runAndReadAll(`
      SELECT equipment_id::VARCHAR,quantity_required
      FROM exercise_outdoor_variant_equipment
      WHERE exercise_id=$exerciseId::UUID
      ORDER BY equipment_id::VARCHAR
    `, { exerciseId });

    return {
      enabled: Boolean(exerciseReader.getRows()[0]?.[0]),
      textDe: textByLocale.get("de") ?? "",
      textEn: textByLocale.get("en") ?? "",
      equipment: equipmentReader.getRows().map((row) => ({
        id: String(row[0]),
        seedKey: row[1] == null ? null : String(row[1]),
        labelDe: String(row[2]),
        labelEn: String(row[3]),
        quantityAvailable: row[4] == null ? null : Number(row[4]),
      })),
      selectedEquipment: selectedReader.getRows().map((row) => ({
        id: String(row[0]),
        quantityRequired: Math.max(1, Number(row[1] ?? 1)),
      })),
    };
  });
}

export async function updateExerciseOutdoorVariant(
  exerciseId: string,
  input: UpdateExerciseOutdoorVariantInput,
): Promise<void> {
  await ensureDatabaseReady();
  const equipment = [...new Map(
    input.equipment
      .filter((item) => item.id.trim() && Number.isInteger(item.quantityRequired) && item.quantityRequired >= 1)
      .map((item) => [item.id.trim(), { id: item.id.trim(), quantityRequired: Math.min(99, item.quantityRequired) }]),
  ).values()];

  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const exerciseReader = await connection.runAndReadAll(
        "SELECT id::VARCHAR FROM exercises WHERE id=$exerciseId::UUID",
        { exerciseId },
      );
      if (exerciseReader.getRows().length === 0) throw new Error("Übung wurde nicht gefunden.");

      const validEquipment = new Set<string>();
      if (equipment.length > 0) {
        const reader = await connection.runAndReadAll(`
          SELECT id::VARCHAR FROM equipment
          WHERE archived=false AND list_contains(string_split($ids,','),id::VARCHAR)
        `, { ids: equipment.map((item) => item.id).join(",") });
        reader.getRows().forEach((row) => validEquipment.add(String(row[0])));
        if (validEquipment.size !== equipment.length) throw new Error("Outdoor-Equipment enthält ungültige Einträge.");
      }

      await connection.run(
        "DELETE FROM exercise_outdoor_variant_equipment WHERE exercise_id=$exerciseId::UUID",
        { exerciseId },
      );
      for (const item of equipment) {
        await connection.run(`
          INSERT INTO exercise_outdoor_variant_equipment (exercise_id,equipment_id,quantity_required)
          VALUES ($exerciseId::UUID,$equipmentId::UUID,$quantity)
        `, { exerciseId, equipmentId: item.id, quantity: item.quantityRequired });
      }

      await connection.run(`
        UPDATE exercise_details SET outdoor_variant=$text
        WHERE exercise_id=$exerciseId::UUID AND locale=$locale
      `, { exerciseId, locale: "de", text: input.textDe.trim() });
      await connection.run(`
        UPDATE exercise_details SET outdoor_variant=$text
        WHERE exercise_id=$exerciseId::UUID AND locale=$locale
      `, { exerciseId, locale: "en", text: input.textEn.trim() });
      await connection.run(`
        UPDATE exercises SET outdoor_suitable=$enabled,updated_at=current_timestamp
        WHERE id=$exerciseId::UUID
      `, { exerciseId, enabled: input.enabled });

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
