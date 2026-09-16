import type { DuckDBConnection } from "@duckdb/node-api";

export interface TrainingEquipmentOption {
  readonly id: string;
  readonly name: string;
  readonly quantityAvailable: number | null;
}

export async function runTrainingEquipmentOptionsQuery(
  connection: DuckDBConnection,
  locale: "de" | "en",
): Promise<readonly TrainingEquipmentOption[]> {
  const reader = await connection.runAndReadAll(
    `
    SELECT id::VARCHAR,
      CASE WHEN $locale='de' THEN name_de ELSE COALESCE(name_en,name_de) END,
      quantity_available
    FROM equipment
    WHERE archived=false
    ORDER BY CASE WHEN $locale='de' THEN name_de ELSE COALESCE(name_en,name_de) END
    `,
    { locale },
  );

  return reader.getRows().map((row) => ({
    id: String(row[0]),
    name: String(row[1]),
    quantityAvailable: row[2] == null ? null : Number(row[2]),
  }));
}
