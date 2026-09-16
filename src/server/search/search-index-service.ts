import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

export type SearchLocale = "de" | "en";

export async function rebuildSearchIndex(locale: SearchLocale): Promise<void> {
  await ensureDatabaseReady();
  const table = locale === "de" ? "search_documents_de" : "search_documents_en";
  const stemmer = locale === "de" ? "german" : "english";
  const stopwords = locale === "de" ? "none" : "english";

  await withDuckDbConnection(async (connection) => {
    await connection.run(
      "UPDATE search_index_state SET status='rebuilding', last_error=NULL WHERE locale=$locale",
      { locale },
    );
    try {
      await connection.run("INSTALL fts; LOAD fts;");
      await connection.run(
        `PRAGMA create_fts_index('${table}', 'document_id', 'title', 'aliases', 'summary', 'tags', 'body_regions', 'equipment', 'instructions', stemmer='${stemmer}', stopwords='${stopwords}', strip_accents=1, lower=1, overwrite=1)`,
      );
      const countReader = await connection.runAndReadAll(`SELECT count(*) FROM ${table}`);
      const count = Number(countReader.getRows()[0]?.[0] ?? 0);
      await connection.run(
        "UPDATE search_index_state SET status='healthy', last_rebuilt_at=current_timestamp, indexed_document_count=$count, last_error=NULL WHERE locale=$locale",
        { locale, count },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await connection.run(
        "UPDATE search_index_state SET status='failed', last_error=$message WHERE locale=$locale",
        { locale, message },
      );
      throw error;
    }
  });
}
