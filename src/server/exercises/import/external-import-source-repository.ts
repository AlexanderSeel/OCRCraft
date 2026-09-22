import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { decryptAiProviderSecret, encryptAiProviderSecret, canStoreAiProviderSecret } from "@/server/ai/ai-provider-secret";

export type ExternalImportProvider = "exercisedb" | "hasaneyldrm";

export interface ExternalImportSourceView {
  readonly provider: ExternalImportProvider;
  readonly baseUrl: string;
  readonly enabled: boolean;
  readonly hasApiKey: boolean;
  readonly lastImportAt: string | null;
  readonly lastImportResult: string | null;
  readonly keyStorageAvailable: boolean;
}

export async function listExternalImportSources(): Promise<readonly ExternalImportSourceView[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll("SELECT provider,base_url,enabled,encrypted_api_key,last_import_at::VARCHAR,last_import_result FROM external_import_sources ORDER BY provider");
    return reader.getRows().map((row) => ({
      provider: String(row[0]) as ExternalImportProvider,
      baseUrl: String(row[1]),
      enabled: Boolean(row[2]),
      hasApiKey: Boolean(row[3] && String(row[3]).trim()),
      lastImportAt: row[4] == null ? null : String(row[4]),
      lastImportResult: row[5] == null ? null : String(row[5]),
      keyStorageAvailable: canStoreAiProviderSecret(),
    }));
  });
}

export async function saveExternalImportSource(input: {
  readonly provider: ExternalImportProvider;
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly clearApiKey?: boolean;
  readonly enabled: boolean;
}): Promise<void> {
  const encrypted = input.clearApiKey ? null : input.apiKey?.trim() ? encryptAiProviderSecret(input.apiKey.trim()) : undefined;
  await ensureDatabaseReady();
  await withDuckDbConnection((connection) => connection.run(`
    UPDATE external_import_sources
    SET base_url=$baseUrl, enabled=$enabled,
        encrypted_api_key=CASE WHEN $replaceKey THEN $encryptedApiKey ELSE encrypted_api_key END,
        updated_at=current_timestamp
    WHERE provider=$provider
  `, {
    provider: input.provider,
    baseUrl: input.baseUrl.trim(),
    enabled: input.enabled,
    replaceKey: encrypted !== undefined,
    encryptedApiKey: encrypted ?? null,
  }));
}

export async function resolveExternalImportSource(provider: ExternalImportProvider): Promise<{ readonly baseUrl: string; readonly apiKey?: string; readonly enabled: boolean }> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll("SELECT base_url,enabled,encrypted_api_key FROM external_import_sources WHERE provider=$provider", { provider });
    const row = reader.getRows()[0];
    if (!row) throw new Error("Importquelle ist nicht konfiguriert.");
    const encrypted = row[2] == null ? "" : String(row[2]);
    return { baseUrl: String(row[0]), enabled: Boolean(row[1]), apiKey: encrypted ? decryptAiProviderSecret(encrypted) : undefined };
  });
}

export async function recordExternalImportResult(provider: ExternalImportProvider, result: string): Promise<void> {
  await withDuckDbConnection((connection) => connection.run("UPDATE external_import_sources SET last_import_at=current_timestamp,last_import_result=$result,updated_at=current_timestamp WHERE provider=$provider", { provider, result: result.slice(0, 1000) }));
}
