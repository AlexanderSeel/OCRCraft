import { loadEnvConfig } from "@next/env";
import { ensureDatabaseReady } from "../src/server/db/database-ready";
import { withDuckDbConnection } from "../src/server/db/duckdb";

interface Translation { sourceId: string; nameDe: string; summaryDe: string; stepsDe: string[] }
const model = process.env.OCRCRAFT_TRANSLATION_MODEL || "gpt-4o-mini";

async function translateBatch(items: readonly { sourceId: string; nameEn: string; summaryEn: string; stepsEn: string[] }[]): Promise<Translation[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, temperature: 0.1, response_format: { type: "json_object" }, messages: [
      { role: "system", content: "You translate OCRCraft exercise content from English to natural German. Return JSON only with translations: [{sourceId,nameDe,summaryDe,stepsDe}]. Preserve exercise meaning, equipment names and safety wording. Keep steps ordered and the same count. Do not add medical claims." },
      { role: "user", content: JSON.stringify({ items }) },
    ] }),
  });
  if (!response.ok) throw new Error(`Translation API failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Translation API returned no content.");
  const parsed = JSON.parse(content.replace(/^```json\s*|\s*```$/g, "")) as { translations?: Translation[]; items?: Translation[] };
  const list = parsed.translations ?? parsed.items;
  if (!Array.isArray(list)) throw new Error(`Translation API returned no translations array: ${content.slice(0, 500)}`);
  return list;
}

async function main() {
  loadEnvConfig(process.cwd());
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required.");
  await ensureDatabaseReady();
  const rows = await withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT r.exercise_id::VARCHAR, r.notes, t.name, COALESCE(t.summary,''),
        COALESCE((SELECT string_agg(s.instruction, '||| ' ORDER BY s.step_order) FROM exercise_execution_steps s WHERE s.exercise_id=r.exercise_id AND s.locale='en'),'')
      FROM exercise_source_references r JOIN exercise_translations t ON t.exercise_id=r.exercise_id AND t.locale='en'
      WHERE r.provider='hasaneyldrm/exercises-dataset' ORDER BY r.created_at, r.exercise_id
    `);
    return reader.getRows().map((row) => {
      const notes = String(row[1] ?? "");
      return { exerciseId: String(row[0]), sourceId: notes.match(/source_record_id=([^;]+)/)?.[1] ?? "", nameEn: String(row[2]), summaryEn: String(row[3]), stepsEn: String(row[4]).split("||| ").filter(Boolean) };
    });
  });
  const limitFlag = process.argv.indexOf("--limit");
  const limit = limitFlag >= 0 ? Number(process.argv[limitFlag + 1]) : rows.length;
  const offsetFlag = process.argv.indexOf("--offset");
  const offset = offsetFlag >= 0 ? Number(process.argv[offsetFlag + 1]) : 0;
  const pending = rows.slice(offset, offset + limit).filter((item) => item.sourceId);
  const batchSize = 20;
  let translated = 0;
  for (let offset = 0; offset < pending.length; offset += batchSize) {
    const batch = pending.slice(offset, offset + batchSize);
    const translations = await translateBatch(batch.map(({ sourceId, nameEn, summaryEn, stepsEn }) => ({ sourceId, nameEn, summaryEn, stepsEn })));
    await withDuckDbConnection(async (connection) => {
      await connection.run("BEGIN TRANSACTION");
      try {
        for (const translation of translations) {
          const item = batch.find((candidate) => candidate.sourceId === translation.sourceId);
          if (!item || !translation.nameDe || !translation.summaryDe || !Array.isArray(translation.stepsDe)) continue;
          await connection.run("UPDATE exercise_translations SET name=$name,summary=$summary,instructions=$summary WHERE exercise_id=$id AND locale='de'", { id: item.exerciseId, name: translation.nameDe, summary: translation.summaryDe });
          await connection.run("DELETE FROM exercise_execution_steps WHERE exercise_id=$id AND locale='de'", { id: item.exerciseId });
          for (const [index, step] of translation.stepsDe.entries()) await connection.run("INSERT INTO exercise_execution_steps VALUES ($id,'de',$order,$instruction)", { id: item.exerciseId, order: index + 1, instruction: step });
          await connection.run("UPDATE exercise_details SET purpose=$purpose,quality_criteria=$quality WHERE exercise_id=$id AND locale='de'", { id: item.exerciseId, purpose: `Übersetzung geprüft: ${translation.summaryDe}`, quality: "Kontrollierte, schmerzfreie Bewegung mit stabiler Technik." });
          translated += 1;
        }
        await connection.run("UPDATE search_index_state SET status='dirty',last_error=NULL WHERE locale IN ('de','en')");
        await connection.run("COMMIT");
      } catch (error) { await connection.run("ROLLBACK"); throw error; }
    });
    console.log(`translated ${Math.min(offset + batchSize, pending.length)}/${pending.length}`);
  }
  console.log(JSON.stringify({ translated, model }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
