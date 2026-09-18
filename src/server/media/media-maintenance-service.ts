import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  createExerciseImageStorageFromEnvironment,
  type ExerciseImageStorage,
} from "@/server/images/exercise-image-storage";
import { diffMediaStorageKeys } from "./media-maintenance-core";

export interface MissingMediaStorageAsset {
  readonly assetId: string;
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly storageKey: string;
}

export interface MediaMaintenanceSummary {
  readonly storageProvider: "filesystem" | "s3" | null;
  readonly available: boolean;
  readonly errorMessage: string | null;
  readonly referencedObjectCount: number;
  readonly storedObjectCount: number;
  readonly orphanedObjectCount: number;
  readonly missingObjectCount: number;
  readonly orphanedKeys: readonly string[];
  readonly missingAssets: readonly MissingMediaStorageAsset[];
}

type MediaStorageReference = MissingMediaStorageAsset;

async function listStorageReferences(
  provider: "filesystem" | "s3",
): Promise<readonly MediaStorageReference[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        m.id::VARCHAR,
        m.exercise_id::VARCHAR,
        COALESCE(t.name,e.canonical_name),
        m.storage_key
      FROM exercise_media_assets m
      JOIN exercises e ON e.id=m.exercise_id
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
      WHERE m.storage_provider=$provider
        AND m.storage_key IS NOT NULL
        AND trim(m.storage_key)<>''
      ORDER BY m.created_at,m.id
    `, { provider });
    return reader.getRows().map((row) => ({
      assetId: String(row[0]),
      exerciseId: String(row[1]),
      exerciseName: String(row[2]),
      storageKey: String(row[3]).replaceAll("\\", "/").replace(/^\/+/, ""),
    }));
  });
}

async function withInventoryStorage<T>(
  callback: (storage: ExerciseImageStorage & { listKeys(): Promise<readonly string[]> }) => Promise<T>,
): Promise<T> {
  const storage = createExerciseImageStorageFromEnvironment();
  if (!storage.listKeys) {
    storage.close?.();
    throw new Error("Das konfigurierte Medien-Storage unterstützt keine Inventarisierung.");
  }
  try {
    return await callback(storage as ExerciseImageStorage & { listKeys(): Promise<readonly string[]> });
  } finally {
    storage.close?.();
  }
}

export async function getMediaMaintenanceSummary(): Promise<MediaMaintenanceSummary> {
  try {
    return await withInventoryStorage(async (storage) => {
      const [storedKeys, references] = await Promise.all([
        storage.listKeys(),
        listStorageReferences(storage.provider),
      ]);
      const diff = diffMediaStorageKeys(
        storedKeys,
        references.map((reference) => reference.storageKey),
      );
      const missingSet = new Set(diff.missingKeys);
      return {
        storageProvider: storage.provider,
        available: true,
        errorMessage: null,
        referencedObjectCount: references.length,
        storedObjectCount: storedKeys.length,
        orphanedObjectCount: diff.orphanedKeys.length,
        missingObjectCount: diff.missingKeys.length,
        orphanedKeys: diff.orphanedKeys.slice(0, 12),
        missingAssets: references.filter((reference) => missingSet.has(reference.storageKey)).slice(0, 12),
      };
    });
  } catch {
    return {
      storageProvider: null,
      available: false,
      errorMessage: "Das konfigurierte Medien-Storage konnte nicht inventarisiert werden.",
      referencedObjectCount: 0,
      storedObjectCount: 0,
      orphanedObjectCount: 0,
      missingObjectCount: 0,
      orphanedKeys: [],
      missingAssets: [],
    };
  }
}

export async function deleteOrphanedMediaObjects(): Promise<{
  readonly storageProvider: "filesystem" | "s3";
  readonly deleted: number;
}> {
  return withInventoryStorage(async (storage) => {
    const [storedKeys, references] = await Promise.all([
      storage.listKeys(),
      listStorageReferences(storage.provider),
    ]);
    const { orphanedKeys } = diffMediaStorageKeys(
      storedKeys,
      references.map((reference) => reference.storageKey),
    );
    for (const key of orphanedKeys) {
      await storage.delete(key);
    }
    return { storageProvider: storage.provider, deleted: orphanedKeys.length };
  });
}
