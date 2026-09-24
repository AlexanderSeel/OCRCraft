import type { DuckDBConnection } from "@duckdb/node-api";
import { classifyEquipmentPortability, type EquipmentPortability } from "@/domain/equipment-portability";

export interface TrainingEquipmentOption {
  readonly id: string;
  readonly seedKey: string | null;
  readonly name: string;
  readonly quantityAvailable: number | null;
  readonly portability: EquipmentPortability;
}

export interface TrainingObstacleOption {
  readonly id: string;
  readonly name: string;
  readonly stationCapacity: number | null;
  readonly heightCm: number | null;
  readonly spanCm: number | null;
  readonly reachCm: number | null;
}

export async function runTrainingEquipmentOptionsQuery(
  connection: DuckDBConnection,
  locale: "de" | "en",
): Promise<readonly TrainingEquipmentOption[]> {
  const reader = await connection.runAndReadAll(
    `
    SELECT id::VARCHAR,
      seed_key,
      CASE WHEN $locale='de' THEN name_de ELSE COALESCE(name_en,name_de) END,
      quantity_available
    FROM equipment
    WHERE archived=false
    ORDER BY CASE WHEN $locale='de' THEN name_de ELSE COALESCE(name_en,name_de) END
    `,
    { locale },
  );

  return reader.getRows().map((row) => {
    const seedKey = row[1] == null ? null : String(row[1]);
    return {
      id: String(row[0]),
      seedKey,
      name: String(row[2]),
      quantityAvailable: row[3] == null ? null : Number(row[3]),
      portability: classifyEquipmentPortability(seedKey),
    };
  });
}

export async function runTrainingObstacleOptionsQuery(
  connection: DuckDBConnection,
  locale: "de" | "en",
): Promise<readonly TrainingObstacleOption[]> {
  const reader = await connection.runAndReadAll(
    `
    SELECT
      e.id::VARCHAR,
      COALESCE(t.name,e.canonical_name),
      COALESCE(d.station_capacity,e.station_capacity),
      e.club_obstacle_height_cm,
      e.club_obstacle_span_cm,
      e.club_obstacle_reach_cm
    FROM exercises e
    LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale=$locale
    LEFT JOIN exercise_details d ON d.exercise_id=e.id AND d.locale=$locale
    WHERE e.archived=false
      AND EXISTS (
        SELECT 1 FROM exercise_obstacle_guidance og WHERE og.exercise_id=e.id
      )
    ORDER BY COALESCE(t.name,e.canonical_name),e.id::VARCHAR
    `,
    { locale },
  );

  return reader.getRows().map((row) => ({
    id: String(row[0]),
    name: String(row[1]),
    stationCapacity: row[2] == null ? null : Number(row[2]),
    heightCm: row[3] == null ? null : Number(row[3]),
    spanCm: row[4] == null ? null : Number(row[4]),
    reachCm: row[5] == null ? null : Number(row[5]),
  }));
}
