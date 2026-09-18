import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  DEFAULT_SEARCH_RANKING_WEIGHTS,
  normalizeSearchRankingWeights,
  type SearchRankingWeights,
} from "./search-profile-core";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface SearchProfile {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly weights: SearchRankingWeights;
  readonly updatedAt: string;
}

function mapProfile(row: readonly unknown[]): SearchProfile {
  return {
    id: String(row[0]),
    name: String(row[1]),
    isActive: Boolean(row[2]),
    weights: normalizeSearchRankingWeights({
      exact: Number(row[3]),
      prefix: Number(row[4]),
      alias: Number(row[5]),
      summary: Number(row[6]),
      taxonomy: Number(row[7]),
      bodyRegions: Number(row[8]),
      equipment: Number(row[9]),
      instructions: Number(row[10]),
    }),
    updatedAt: String(row[11]),
  };
}

const PROFILE_SELECT = `
  SELECT id::VARCHAR,name,is_active,
    exact_weight,prefix_weight,alias_weight,summary_weight,taxonomy_weight,
    body_regions_weight,equipment_weight,instructions_weight,updated_at
  FROM search_profiles
`;

export async function listSearchProfiles(): Promise<readonly SearchProfile[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      PROFILE_SELECT + " ORDER BY is_active DESC, lower(name), id",
    );
    return reader.getRows().map(mapProfile);
  });
}

export async function getActiveSearchProfile(): Promise<SearchProfile> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      PROFILE_SELECT + " WHERE is_active=true ORDER BY updated_at DESC,id LIMIT 1",
    );
    const row = reader.getRows()[0];
    if (row) return mapProfile(row);
    return {
      id: "default",
      name: "Ausgewogen",
      isActive: true,
      weights: DEFAULT_SEARCH_RANKING_WEIGHTS,
      updatedAt: "",
    };
  });
}

export interface SaveSearchProfileInput {
  readonly id?: string | null;
  readonly name: string;
  readonly weights: Partial<SearchRankingWeights>;
}

export async function saveSearchProfile(input: SaveSearchProfileInput): Promise<string> {
  if (input.id && !UUID_PATTERN.test(input.id)) throw new Error("Ungültige Suchprofil-ID.");
  const name = input.name.trim();
  if (!name || name.length > 80) throw new Error("Suchprofilname ist ungültig.");
  const weights = normalizeSearchRankingWeights(input.weights);

  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    if (input.id) {
      const reader = await connection.runAndReadAll(`
        UPDATE search_profiles SET
          name=$name,
          exact_weight=$exact,
          prefix_weight=$prefix,
          alias_weight=$alias,
          summary_weight=$summary,
          taxonomy_weight=$taxonomy,
          body_regions_weight=$bodyRegions,
          equipment_weight=$equipment,
          instructions_weight=$instructions,
          updated_at=current_timestamp
        WHERE id=$id::UUID
        RETURNING id::VARCHAR
      `, { id: input.id, name, ...weights });
      const id = reader.getRows()[0]?.[0];
      if (id == null) throw new Error("Suchprofil wurde nicht gefunden.");
      return String(id);
    }

    const reader = await connection.runAndReadAll(`
      INSERT INTO search_profiles (
        name,is_active,exact_weight,prefix_weight,alias_weight,summary_weight,
        taxonomy_weight,body_regions_weight,equipment_weight,instructions_weight
      ) VALUES (
        $name,false,$exact,$prefix,$alias,$summary,$taxonomy,$bodyRegions,$equipment,$instructions
      )
      RETURNING id::VARCHAR
    `, { name, ...weights });
    return String(reader.getRows()[0]?.[0]);
  });
}

export async function activateSearchProfile(id: string): Promise<boolean> {
  if (!UUID_PATTERN.test(id)) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      const exists = await connection.runAndReadAll(
        "SELECT 1 FROM search_profiles WHERE id=$id::UUID",
        { id },
      );
      if (!exists.getRows().length) {
        await connection.run("ROLLBACK");
        return false;
      }
      await connection.run("UPDATE search_profiles SET is_active=false WHERE is_active=true");
      await connection.run(
        "UPDATE search_profiles SET is_active=true,updated_at=current_timestamp WHERE id=$id::UUID",
        { id },
      );
      await connection.run("COMMIT");
      return true;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

export async function deleteSearchProfile(id: string): Promise<boolean> {
  if (!UUID_PATTERN.test(id)) return false;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      DELETE FROM search_profiles
      WHERE id=$id::UUID
        AND is_active=false
        AND (SELECT count(*) FROM search_profiles) > 1
      RETURNING id::VARCHAR
    `, { id });
    return reader.getRows().length === 1;
  });
}
