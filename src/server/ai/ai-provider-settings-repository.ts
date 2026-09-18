import "server-only";

import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  canStoreAiProviderSecret,
  decryptAiProviderSecret,
  encryptAiProviderSecret,
} from "./ai-provider-secret";

export const aiProviderIdSchema = z.enum(["openai","gemini","anthropic","openai-compatible"]);
export type AiProviderId = z.infer<typeof aiProviderIdSchema>;
export type AiProviderProtocol = "openai-compatible" | "anthropic";
export type AiCapability = "training" | "exercise_draft" | "image";

export interface AiProviderUsageSummary {
  readonly requests: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
  readonly images: number;
}

export interface AiProviderSettingsView {
  readonly providerId: AiProviderId;
  readonly protocol: AiProviderProtocol;
  readonly displayName: string;
  readonly enabled: boolean;
  readonly useForTraining: boolean;
  readonly useForExerciseDrafts: boolean;
  readonly baseUrl: string | null;
  readonly modelId: string | null;
  readonly authMode: "environment" | "encrypted_key";
  readonly apiKeyEnv: string | null;
  readonly hasStoredApiKey: boolean;
  readonly environmentKeyAvailable: boolean;
  readonly monthlyTokenLimit: number | null;
  readonly monthlyRequestLimit: number | null;
  readonly usage: AiProviderUsageSummary;
  readonly keyStorageAvailable: boolean;
}

export interface ResolvedAiProvider {
  readonly providerId: string;
  readonly protocol: AiProviderProtocol;
  readonly baseUrl: string;
  readonly modelId: string;
  readonly apiKey?: string;
}

export interface UpdateAiProviderSettingsInput {
  readonly providerId: AiProviderId;
  readonly enabled: boolean;
  readonly useForTraining: boolean;
  readonly useForExerciseDrafts: boolean;
  readonly baseUrl: string | null;
  readonly modelId: string | null;
  readonly authMode: "environment" | "encrypted_key";
  readonly apiKeyEnv: string | null;
  readonly apiKey?: string;
  readonly clearStoredApiKey?: boolean;
  readonly monthlyTokenLimit: number | null;
  readonly monthlyRequestLimit: number | null;
  readonly updatedBy: string;
}

function numberOrNull(value: unknown): number | null {
  return value == null ? null : Number(value);
}

export async function listAiProviderSettings(): Promise<readonly AiProviderSettingsView[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        s.provider_id,s.protocol,s.display_name,s.enabled,s.use_for_training,s.use_for_exercise_drafts,
        s.base_url,s.model_id,s.auth_mode,s.api_key_env,
        CASE WHEN s.encrypted_api_key IS NULL OR trim(s.encrypted_api_key)='' THEN false ELSE true END,
        s.monthly_token_limit,s.monthly_request_limit,
        COALESCE(sum(u.request_count),0),
        COALESCE(sum(u.input_tokens),0),
        COALESCE(sum(u.output_tokens),0),
        COALESCE(sum(u.total_tokens),0),
        COALESCE(sum(u.image_count),0)
      FROM ai_provider_settings s
      LEFT JOIN ai_provider_usage_events u
        ON u.provider_id=s.provider_id
       AND u.created_at >= date_trunc('month', current_timestamp)
      GROUP BY
        s.provider_id,s.protocol,s.display_name,s.enabled,s.use_for_training,s.use_for_exercise_drafts,
        s.base_url,s.model_id,s.auth_mode,s.api_key_env,s.encrypted_api_key,
        s.monthly_token_limit,s.monthly_request_limit
      ORDER BY CASE s.provider_id WHEN 'openai' THEN 1 WHEN 'gemini' THEN 2 WHEN 'anthropic' THEN 3 ELSE 4 END
    `);
    return reader.getRows().map((row) => {
      const envName = row[9] == null ? null : String(row[9]);
      return {
        providerId: aiProviderIdSchema.parse(String(row[0])),
        protocol: String(row[1]) as AiProviderProtocol,
        displayName: String(row[2]),
        enabled: Boolean(row[3]),
        useForTraining: Boolean(row[4]),
        useForExerciseDrafts: Boolean(row[5]),
        baseUrl: row[6] == null ? null : String(row[6]),
        modelId: row[7] == null ? null : String(row[7]),
        authMode: String(row[8]) as "environment" | "encrypted_key",
        apiKeyEnv: envName,
        hasStoredApiKey: Boolean(row[10]),
        environmentKeyAvailable: Boolean(envName && process.env[envName]?.trim()),
        monthlyTokenLimit: numberOrNull(row[11]),
        monthlyRequestLimit: numberOrNull(row[12]),
        usage: {
          requests: Number(row[13] ?? 0),
          inputTokens: Number(row[14] ?? 0),
          outputTokens: Number(row[15] ?? 0),
          totalTokens: Number(row[16] ?? 0),
          images: Number(row[17] ?? 0),
        },
        keyStorageAvailable: canStoreAiProviderSecret(),
      };
    });
  });
}

export async function updateAiProviderSettings(input: UpdateAiProviderSettingsInput): Promise<void> {
  await ensureDatabaseReady();
  await withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      if (input.useForTraining) {
        await connection.run("UPDATE ai_provider_settings SET use_for_training=false");
      }
      if (input.useForExerciseDrafts) {
        await connection.run("UPDATE ai_provider_settings SET use_for_exercise_drafts=false");
      }

      let encryptedApiKey: string | null | undefined;
      if (input.clearStoredApiKey) encryptedApiKey = null;
      else if (input.apiKey?.trim()) encryptedApiKey = encryptAiProviderSecret(input.apiKey.trim());

      await connection.run(`
        UPDATE ai_provider_settings
        SET
          enabled=$enabled,
          use_for_training=$useForTraining,
          use_for_exercise_drafts=$useForExerciseDrafts,
          base_url=$baseUrl,
          model_id=$modelId,
          auth_mode=$authMode,
          api_key_env=$apiKeyEnv,
          encrypted_api_key=CASE WHEN $replaceSecret THEN $encryptedApiKey ELSE encrypted_api_key END,
          monthly_token_limit=$monthlyTokenLimit,
          monthly_request_limit=$monthlyRequestLimit,
          updated_by=$updatedBy::UUID,
          updated_at=current_timestamp
        WHERE provider_id=$providerId
      `, {
        providerId: input.providerId,
        enabled: input.enabled,
        useForTraining: input.useForTraining,
        useForExerciseDrafts: input.useForExerciseDrafts,
        baseUrl: input.baseUrl,
        modelId: input.modelId,
        authMode: input.authMode,
        apiKeyEnv: input.apiKeyEnv,
        replaceSecret: encryptedApiKey !== undefined,
        encryptedApiKey: encryptedApiKey ?? null,
        monthlyTokenLimit: input.monthlyTokenLimit,
        monthlyRequestLimit: input.monthlyRequestLimit,
        updatedBy: input.updatedBy,
      });
      await connection.run("COMMIT");
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

async function currentUsage(providerId: string): Promise<AiProviderUsageSummary> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        COALESCE(sum(request_count),0),
        COALESCE(sum(input_tokens),0),
        COALESCE(sum(output_tokens),0),
        COALESCE(sum(total_tokens),0),
        COALESCE(sum(image_count),0)
      FROM ai_provider_usage_events
      WHERE provider_id=$providerId
        AND created_at >= date_trunc('month', current_timestamp)
    `, { providerId });
    const row = reader.getRows()[0] ?? [];
    return {
      requests: Number(row[0] ?? 0),
      inputTokens: Number(row[1] ?? 0),
      outputTokens: Number(row[2] ?? 0),
      totalTokens: Number(row[3] ?? 0),
      images: Number(row[4] ?? 0),
    };
  });
}

async function configuredProvider(capability: "training" | "exercise_draft") {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const column = capability === "training" ? "use_for_training" : "use_for_exercise_drafts";
    const reader = await connection.runAndReadAll(`
      SELECT
        provider_id,protocol,base_url,model_id,auth_mode,api_key_env,encrypted_api_key,
        monthly_token_limit,monthly_request_limit
      FROM ai_provider_settings
      WHERE enabled=true AND ${column}=true
      LIMIT 1
    `);
    return reader.getRows()[0] ?? null;
  });
}

export async function resolveAiProvider(capability: "training" | "exercise_draft"): Promise<ResolvedAiProvider | null> {
  const row = await configuredProvider(capability);
  if (!row) {
    const legacyBaseUrl = process.env.OCRCRAFT_AI_BASE_URL?.trim();
    const legacyModel = process.env.OCRCRAFT_AI_MODEL?.trim();
    if (!legacyBaseUrl || !legacyModel) return null;
    return {
      providerId: "legacy-openai-compatible",
      protocol: "openai-compatible",
      baseUrl: legacyBaseUrl,
      modelId: legacyModel,
      apiKey: process.env.OCRCRAFT_AI_API_KEY?.trim() || undefined,
    };
  }

  const providerId = String(row[0]);
  const baseUrl = row[2] == null ? "" : String(row[2]).trim();
  const modelId = row[3] == null ? "" : String(row[3]).trim();
  if (!baseUrl || !modelId) {
    throw new Error(`AI-Provider ${providerId} ist aktiviert, aber Base-URL oder Modell fehlen.`);
  }

  const usage = await currentUsage(providerId);
  const tokenLimit = numberOrNull(row[7]);
  const requestLimit = numberOrNull(row[8]);
  if (tokenLimit != null && usage.totalTokens >= tokenLimit) {
    throw new Error(`Monatliches Token-Limit für ${providerId} ist erreicht.`);
  }
  if (requestLimit != null && usage.requests >= requestLimit) {
    throw new Error(`Monatliches Request-Limit für ${providerId} ist erreicht.`);
  }

  const authMode = String(row[4]);
  let apiKey: string | undefined;
  if (authMode === "encrypted_key") {
    const encrypted = row[6] == null ? "" : String(row[6]);
    if (!encrypted) throw new Error(`Für ${providerId} ist kein gespeicherter API-Key vorhanden.`);
    apiKey = decryptAiProviderSecret(encrypted);
  } else {
    const envName = row[5] == null ? "" : String(row[5]).trim();
    apiKey = envName ? process.env[envName]?.trim() || undefined : undefined;
  }

  return {
    providerId,
    protocol: String(row[1]) as AiProviderProtocol,
    baseUrl,
    modelId,
    apiKey,
  };
}

export async function recordAiProviderUsage(input: {
  readonly providerId: string;
  readonly capability: AiCapability;
  readonly modelId: string | null;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
  readonly imageCount?: number;
  readonly status?: "succeeded" | "failed";
}): Promise<void> {
  await ensureDatabaseReady();
  await withDuckDbConnection(async (connection) => {
    await connection.run(`
      INSERT INTO ai_provider_usage_events (
        provider_id,capability,model_id,input_tokens,output_tokens,total_tokens,image_count,status
      ) VALUES (
        $providerId,$capability,$modelId,$inputTokens,$outputTokens,$totalTokens,$imageCount,$status
      )
    `, {
      providerId: input.providerId,
      capability: input.capability,
      modelId: input.modelId,
      inputTokens: Math.max(0, Math.trunc(input.inputTokens ?? 0)),
      outputTokens: Math.max(0, Math.trunc(input.outputTokens ?? 0)),
      totalTokens: Math.max(0, Math.trunc(input.totalTokens ?? 0)),
      imageCount: Math.max(0, Math.trunc(input.imageCount ?? 0)),
      status: input.status ?? "succeeded",
    });
  });
}
