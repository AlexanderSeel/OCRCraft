import { withDuckDbConnection } from "./duckdb";

/** Fails fast when a database starts without a usable versioned seed catalog. */
export async function validateInitialSeedCatalog(): Promise<void> {
  await withDuckDbConnection(async (connection) => {
    const countReader = await connection.runAndReadAll(
      "SELECT count(*) FROM exercises WHERE seed_key IS NOT NULL",
    );
    const count = Number(countReader.getRows()[0]?.[0] ?? 0);
    if (count === 0) throw new Error("Initial seed catalog is empty. Run the confirmed database reseed.");

    const gapReader = await connection.runAndReadAll(`
      SELECT count(*) FROM exercises e
      WHERE e.seed_key IS NOT NULL AND trim(e.seed_key)<>''
        AND (NOT EXISTS (SELECT 1 FROM exercise_translations t WHERE t.exercise_id=e.id AND t.locale='de' AND trim(t.name)<>'')
        OR NOT EXISTS (SELECT 1 FROM exercise_translations t WHERE t.exercise_id=e.id AND t.locale='en' AND trim(t.name)<>''))
    `);
    const gaps = Number(gapReader.getRows()[0]?.[0] ?? 0);
    if (gaps > 0) throw new Error(`Initial seed catalog has ${gaps} exercises without stable bilingual identity data.`);
  });
}
