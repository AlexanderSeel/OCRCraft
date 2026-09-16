import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  refreshExerciseSearchDocuments,
  type SearchLocale,
} from "./exercise-search-documents";

export type { SearchLocale } from "./exercise-search-documents";
export type SearchIndexStatus = "healthy" | "dirty" | "rebuilding" | "failed";

export interface SearchIndexState {
  readonly locale: SearchLocale;
  readonly status: SearchIndexStatus;
  readonly lastRebuiltAt: string | null;
  readonly indexedDocumentCount: number;
  readonly lastError: string | null;
}

export async function getSearchIndexStates(): Promise<readonly SearchIndexState[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT locale, status, last_rebuilt_at, indexed_document_count, last_error
      FROM search_index_state
      ORDER BY locale
    `);

    return reader.getRows().map((row) => ({
      locale: String(row[0]) as SearchLocale,
      status: String(row[1]) as SearchIndexStatus,
      lastRebuiltAt: row[2] == null ? null : String(row[2]),
      indexedDocumentCount: Number(row[3] ?? 0),
      lastError: row[4] == null ? null : String(row[4]),
    }));
  });
}

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
      await refreshExerciseSearchDocuments(connection, locale);
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
