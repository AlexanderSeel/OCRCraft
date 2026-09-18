import "server-only";

import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import {
  AI_CAPABILITIES,
  AI_PROVIDER_KINDS,
  defaultImageModel,
  defaultProviderBaseUrl,
  defaultProviderKeyEnvironment,
  evaluateAiUsageLimits,
  providerKindLabel,
  providerProtocol,
  providerSupportsCapability,
  type AiCapability,
  type AiProviderKind,
  type AiProviderProtocol,
} from "./ai-provider-core";
import {
  canStoreAiProviderSecret,
  decryptAiProviderSecret,
  encryptAiProviderSecret,
} from "./ai-provider-secret";

export const aiProviderKindSchema = z.enum(AI_PROVIDER_KINDS);
export const aiProviderInstanceIdSchema = z.string().uuid();
export type { AiCapability } from "./ai-provider-core";

export interface AiProviderUsageSummary {
  readonly requests: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
  readonly images: number;
}

export interface AiProviderAssignmentView {
  readonly capability: AiCapability;
  readonly priority: number;
}

export interface AiProviderSettingsView {
  readonly id: string;
  readonly providerKind: AiProviderKind;
  readonly protocol: AiProviderProtocol;
  readonly displayName: string;
  readonly enabled: boolean;
  readonly baseUrl: string | null;
  readonly textModelId: string | null;
  readonly imageModelId: string | null;
  readonly authMode: "environment" | "encrypted_key";
  readonly apiKeyEnv: string | null;
  readonly hasStoredApiKey: boolean;
  readonly environmentKeyAvailable: boolean;
  readonly monthlyTextTokenLimit: number | null;
  readonly monthlyRequestLimit: number | null;
  readonly usage: AiProviderUsageSummary;
  readonly assignments: readonly AiProviderAssignmentView[];
  readonly keyStorageAvailable: boolean;
}

export interface ResolvedAiProvider {
  readonly instanceId: string | null;
  readonly providerId: string;
  readonly providerKind: AiProviderKind | "legacy";
  readonly protocol: AiProviderProtocol;
  readonly baseUrl: string;
  readonly modelId: string;
  readonly apiKey?: string;
  readonly priority: number;
}

export interface SaveAiProviderInstanceInput {
  readonly id?: string | null;
  readonly providerKind: AiProviderKind;
  readonly displayName: string;
  readonly enabled: boolean;
  readonly baseUrl?: string | null;
  readonly textModelId?: string | null;
  readonly imageModelId?: string | null;
  readonly authMode: "environment" | "encrypted_key";
  readonly apiKeyEnv?: string | null;
  readonly apiKey?: string;
  readonly clearStoredApiKey?: boolean;
  readonly monthlyTextTokenLimit: number | null;
  readonly monthlyRequestLimit: number | null;
  readonly assignments: readonly AiProviderAssignmentView[];
  readonly updatedBy: string;
}

function numberOrNull(value: unknown): number | null {
  return value == null ? null : Number(value);
}

function usageFromRow(row: readonly unknown[], offset: number): AiProviderUsageSummary {
  return {
    requests: Number(row[offset] ?? 0),
    inputTokens: Number(row[offset + 1] ?? 0),
    outputTokens: Number(row[offset + 2] ?? 0),
    totalTokens: Number(row[offset + 3] ?? 0),
    images: Number(row[offset + 4] ?? 0),
  };
}

export async function listAiProviderSettings(): Promise<readonly AiProviderSettingsView[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const providersReader = await connection.runAndReadAll(`
      SELECT
        i.id::VARCHAR,i.provider_kind,i.protocol,i.display_name,i.enabled,
        i.base_url,i.text_model_id,i.image_model_id,i.auth_mode,i.api_key_env,
        CASE WHEN i.encrypted_api_key IS NULL OR trim(i.encrypted_api_key)='' THEN false ELSE true END,
        i.monthly_text_token_limit,i.monthly_request_limit,
        COALESCE(sum(u.request_count),0),
        COALESCE(sum(u.input_tokens),0),
        COALESCE(sum(u.output_tokens),0),
        COALESCE(sum(u.total_tokens),0),
        COALESCE(sum(u.image_count),0)
      FROM ai_provider_instances i
      LEFT JOIN ai_provider_usage_events u
        ON u.provider_instance_id=i.id
       AND u.created_at >= date_trunc('month',current_timestamp)
      GROUP BY
        i.id,i.provider_kind,i.protocol,i.display_name,i.enabled,
        i.base_url,i.text_model_id,i.image_model_id,i.auth_mode,i.api_key_env,
        i.encrypted_api_key,i.monthly_text_token_limit,i.monthly_request_limit,
        i.created_at
      ORDER BY i.created_at,i.display_name
    `);
    const assignmentsReader = await connection.runAndReadAll(`
      SELECT provider_instance_id::VARCHAR,capability,priority
      FROM ai_provider_assignments
      WHERE enabled=true
      ORDER BY capability,priority,provider_instance_id
    `);

    const assignments = new Map<string, AiProviderAssignmentView[]>();
    for (const row of assignmentsReader.getRows()) {
      const id = String(row[0]);
      const list = assignments.get(id) ?? [];
      list.push({
        capability: String(row[1]) as AiCapability,
        priority: Number(row[2]),
      });
      assignments.set(id, list);
    }

    return providersReader.getRows().map((row) => {
      const id = String(row[0]);
      const providerKind = aiProviderKindSchema.parse(String(row[1]));
      const envName = row[9] == null ? null : String(row[9]);
      return {
        id,
        providerKind,
        protocol: String(row[2]) as AiProviderProtocol,
        displayName: String(row[3]),
        enabled: Boolean(row[4]),
        baseUrl: row[5] == null ? defaultProviderBaseUrl(providerKind) : String(row[5]),
        textModelId: row[6] == null ? null : String(row[6]),
        imageModelId: row[7] == null ? defaultImageModel(providerKind) : String(row[7]),
        authMode: String(row[8]) as "environment" | "encrypted_key",
        apiKeyEnv: envName,
        hasStoredApiKey: Boolean(row[10]),
        environmentKeyAvailable: Boolean(envName && process.env[envName]?.trim()),
        monthlyTextTokenLimit: numberOrNull(row[11]),
        monthlyRequestLimit: numberOrNull(row[12]),
        usage: usageFromRow(row, 13),
        assignments: assignments.get(id) ?? [],
        keyStorageAvailable: canStoreAiProviderSecret(),
      };
    });
  });
}

export async function saveAiProviderInstance(input: SaveAiProviderInstanceInput): Promise<string> {
  const providerKind = aiProviderKindSchema.parse(input.providerKind);
  const displayName = input.displayName.trim() || providerKindLabel(providerKind);
  const protocol = providerProtocol(providerKind);
  const baseUrl = providerKind === "openai-compatible"
    ? input.baseUrl?.trim() || null
    : defaultProviderBaseUrl(providerKind);
  const apiKeyEnv = input.apiKeyEnv?.trim()
    || defaultProviderKeyEnvironment(providerKind);
  const textModelId = input.textModelId?.trim() || null;
  const imageModelId = input.imageModelId?.trim() || defaultImageModel(providerKind);
  const normalizedAssignments = input.assignments
    .filter((assignment) => AI_CAPABILITIES.includes(assignment.capability))
    .map((assignment) => ({
      capability: assignment.capability,
      priority: Math.max(1, Math.min(9999, Math.trunc(assignment.priority))),
    }));

  for (const assignment of normalizedAssignments) {
    if (!providerSupportsCapability(providerKind, assignment.capability)) {
      throw new Error(providerKindLabel(providerKind) + " unterstützt " + assignment.capability + " in OCRCraft nicht.");
    }
    if (assignment.capability === "image" && !imageModelId) {
      throw new Error("Für Bildgenerierung muss ein Bildmodell angegeben werden.");
    }
    if (assignment.capability !== "image" && !textModelId) {
      throw new Error("Für Textfunktionen muss ein Textmodell angegeben werden.");
    }
  }
  if (!baseUrl) throw new Error("Für OpenAI-kompatible Provider muss eine Base URL angegeben werden.");

  let encryptedApiKey: string | null | undefined;
  if (input.clearStoredApiKey) encryptedApiKey = null;
  else if (input.apiKey?.trim()) encryptedApiKey = encryptAiProviderSecret(input.apiKey.trim());

  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      let id = input.id?.trim() || null;
      if (id) {
        aiProviderInstanceIdSchema.parse(id);
        const updated = await connection.runAndReadAll(`
          UPDATE ai_provider_instances
          SET provider_kind=$providerKind,
              protocol=$protocol,
              display_name=$displayName,
              enabled=$enabled,
              base_url=$baseUrl,
              text_model_id=$textModelId,
              image_model_id=$imageModelId,
              auth_mode=$authMode,
              api_key_env=$apiKeyEnv,
              encrypted_api_key=CASE WHEN $replaceSecret THEN $encryptedApiKey ELSE encrypted_api_key END,
              monthly_text_token_limit=$monthlyTextTokenLimit,
              monthly_request_limit=$monthlyRequestLimit,
              updated_by=$updatedBy::UUID,
              updated_at=current_timestamp
          WHERE id=$id::UUID
          RETURNING id::VARCHAR
        `, {
          id,
          providerKind,
          protocol,
          displayName,
          enabled: input.enabled,
          baseUrl,
          textModelId,
          imageModelId,
          authMode: input.authMode,
          apiKeyEnv,
          replaceSecret: encryptedApiKey !== undefined,
          encryptedApiKey: encryptedApiKey ?? null,
          monthlyTextTokenLimit: input.monthlyTextTokenLimit,
          monthlyRequestLimit: input.monthlyRequestLimit,
          updatedBy: input.updatedBy,
        });
        if (updated.getRows().length === 0) throw new Error("AI-Instanz wurde nicht gefunden.");
      } else {
        const inserted = await connection.runAndReadAll(`
          INSERT INTO ai_provider_instances (
            provider_kind,protocol,display_name,enabled,base_url,text_model_id,image_model_id,
            auth_mode,api_key_env,encrypted_api_key,monthly_text_token_limit,monthly_request_limit,
            updated_by
          ) VALUES (
            $providerKind,$protocol,$displayName,$enabled,$baseUrl,$textModelId,$imageModelId,
            $authMode,$apiKeyEnv,$encryptedApiKey,$monthlyTextTokenLimit,$monthlyRequestLimit,
            $updatedBy::UUID
          )
          RETURNING id::VARCHAR
        `, {
          providerKind,
          protocol,
          displayName,
          enabled: input.enabled,
          baseUrl,
          textModelId,
          imageModelId,
          authMode: input.authMode,
          apiKeyEnv,
          encryptedApiKey: encryptedApiKey ?? null,
          monthlyTextTokenLimit: input.monthlyTextTokenLimit,
          monthlyRequestLimit: input.monthlyRequestLimit,
          updatedBy: input.updatedBy,
        });
        id = String(inserted.getRows()[0]?.[0]);
      }

      await connection.run(
        "DELETE FROM ai_provider_assignments WHERE provider_instance_id=$id::UUID",
        { id },
      );
      for (const assignment of normalizedAssignments) {
        await connection.run(`
          INSERT INTO ai_provider_assignments (
            provider_instance_id,capability,priority,enabled
          ) VALUES ($id::UUID,$capability,$priority,true)
        `, {
          id,
          capability: assignment.capability,
          priority: assignment.priority,
        });
      }

      await connection.run("COMMIT");
      return id;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

export async function deleteAiProviderInstance(id: string): Promise<boolean> {
  aiProviderInstanceIdSchema.parse(id);
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run(
        "DELETE FROM ai_provider_assignments WHERE provider_instance_id=$id::UUID",
        { id },
      );
      const result = await connection.runAndReadAll(
        "DELETE FROM ai_provider_instances WHERE id=$id::UUID RETURNING id::VARCHAR",
        { id },
      );
      await connection.run("COMMIT");
      return result.getRows().length === 1;
    } catch (error) {
      await connection.run("ROLLBACK");
      throw error;
    }
  });
}

async function currentUsage(instanceId: string): Promise<AiProviderUsageSummary> {
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        COALESCE(sum(request_count),0),
        COALESCE(sum(input_tokens),0),
        COALESCE(sum(output_tokens),0),
        COALESCE(sum(total_tokens),0),
        COALESCE(sum(image_count),0)
      FROM ai_provider_usage_events
      WHERE provider_instance_id=$instanceId::UUID
        AND created_at >= date_trunc('month',current_timestamp)
    `, { instanceId });
    return usageFromRow(reader.getRows()[0] ?? [], 0);
  });
}

export async function resolveAiProviderChain(
  capability: AiCapability,
): Promise<readonly ResolvedAiProvider[]> {
  await ensureDatabaseReady();
  const rows = await withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        i.id::VARCHAR,i.provider_kind,i.protocol,i.display_name,i.base_url,
        i.text_model_id,i.image_model_id,i.auth_mode,i.api_key_env,i.encrypted_api_key,
        i.monthly_text_token_limit,i.monthly_request_limit,a.priority
      FROM ai_provider_assignments a
      JOIN ai_provider_instances i ON i.id=a.provider_instance_id
      WHERE a.capability=$capability
        AND a.enabled=true
        AND i.enabled=true
      ORDER BY a.priority ASC,i.created_at ASC
    `, { capability });
    return reader.getRows();
  });

  const resolved: ResolvedAiProvider[] = [];
  for (const row of rows) {
    const instanceId = String(row[0]);
    const providerKind = aiProviderKindSchema.parse(String(row[1]));
    if (!providerSupportsCapability(providerKind, capability)) continue;
    const usage = await currentUsage(instanceId);
    const limits = evaluateAiUsageLimits({
      requests: usage.requests,
      totalTokens: usage.totalTokens,
      monthlyRequestLimit: numberOrNull(row[11]),
      monthlyTextTokenLimit: numberOrNull(row[10]),
    });
    if (limits.requestLimitReached || limits.textTokenLimitReached) continue;

    const baseUrl = row[4] == null
      ? defaultProviderBaseUrl(providerKind)
      : String(row[4]).trim();
    const modelId = capability === "image"
      ? row[6] == null ? defaultImageModel(providerKind) : String(row[6]).trim()
      : row[5] == null ? null : String(row[5]).trim();
    if (!baseUrl || !modelId) continue;

    const authMode = String(row[7]);
    let apiKey: string | undefined;
    if (authMode === "encrypted_key") {
      const encrypted = row[9] == null ? "" : String(row[9]);
      if (!encrypted) continue;
      apiKey = decryptAiProviderSecret(encrypted);
    } else {
      const envName = row[8] == null ? "" : String(row[8]).trim();
      apiKey = envName ? process.env[envName]?.trim() || undefined : undefined;
    }
    if (providerKind !== "openai-compatible" && !apiKey) continue;

    resolved.push({
      instanceId,
      providerId: String(row[3]),
      providerKind,
      protocol: String(row[2]) as AiProviderProtocol,
      baseUrl,
      modelId,
      apiKey,
      priority: Number(row[12]),
    });
  }

  if (resolved.length > 0) return resolved;

  if (capability === "image" && process.env.OPENAI_API_KEY?.trim()) {
    return [{
      instanceId: null,
      providerId: "OpenAI · Legacy ENV",
      providerKind: "legacy",
      protocol: "openai-compatible",
      baseUrl: "https://api.openai.com/v1",
      modelId: "gpt-image-2",
      apiKey: process.env.OPENAI_API_KEY.trim(),
      priority: 9999,
    }];
  }

  if (capability !== "image") {
    const legacyBaseUrl = process.env.OCRCRAFT_AI_BASE_URL?.trim();
    const legacyModel = process.env.OCRCRAFT_AI_MODEL?.trim();
    if (legacyBaseUrl && legacyModel) {
      return [{
        instanceId: null,
        providerId: "Legacy OpenAI-kompatibel",
        providerKind: "legacy",
        protocol: "openai-compatible",
        baseUrl: legacyBaseUrl,
        modelId: legacyModel,
        apiKey: process.env.OCRCRAFT_AI_API_KEY?.trim() || undefined,
        priority: 9999,
      }];
    }
  }

  return [];
}

export async function resolveAiProvider(
  capability: "training" | "exercise_draft",
): Promise<ResolvedAiProvider | null> {
  return (await resolveAiProviderChain(capability))[0] ?? null;
}

export async function getAiProviderDiscoveryConnection(input: {
  readonly instanceId?: string | null;
  readonly providerKind: AiProviderKind;
  readonly baseUrl?: string | null;
  readonly authMode?: "environment" | "encrypted_key";
  readonly apiKeyEnv?: string | null;
  readonly apiKey?: string | null;
}): Promise<{
  readonly providerKind: AiProviderKind;
  readonly baseUrl: string | null;
  readonly apiKey?: string;
}> {
  let stored: readonly unknown[] | null = null;
  if (input.instanceId) {
    const instanceId = aiProviderInstanceIdSchema.parse(input.instanceId);
    await ensureDatabaseReady();
    stored = await withDuckDbConnection(async (connection) => {
      const reader = await connection.runAndReadAll(`
        SELECT provider_kind,base_url,auth_mode,api_key_env,encrypted_api_key
        FROM ai_provider_instances
        WHERE id=$id::UUID
        LIMIT 1
      `, { id: instanceId });
      return reader.getRows()[0] ?? null;
    });
  }

  const providerKind = stored
    ? aiProviderKindSchema.parse(String(stored[0]))
    : input.providerKind;
  const baseUrl = input.baseUrl?.trim()
    || (stored?.[1] == null ? null : String(stored[1]).trim())
    || defaultProviderBaseUrl(providerKind);
  const explicitKey = input.apiKey?.trim() || null;
  if (explicitKey) return { providerKind, baseUrl, apiKey: explicitKey };

  const authMode = input.authMode ?? (stored ? String(stored[2]) as "environment" | "encrypted_key" : "environment");
  if (authMode === "encrypted_key") {
    const encrypted = stored?.[4] == null ? "" : String(stored[4]);
    return {
      providerKind,
      baseUrl,
      apiKey: encrypted ? decryptAiProviderSecret(encrypted) : undefined,
    };
  }

  const envName = input.apiKeyEnv?.trim()
    || (stored?.[3] == null ? null : String(stored[3]).trim())
    || defaultProviderKeyEnvironment(providerKind);
  return {
    providerKind,
    baseUrl,
    apiKey: envName ? process.env[envName]?.trim() || undefined : undefined,
  };
}

export async function recordAiProviderUsage(input: {
  readonly providerInstanceId?: string | null;
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
        provider_id,provider_instance_id,capability,model_id,
        input_tokens,output_tokens,total_tokens,image_count,status
      ) VALUES (
        $providerId,$providerInstanceId::UUID,$capability,$modelId,
        $inputTokens,$outputTokens,$totalTokens,$imageCount,$status
      )
    `, {
      providerId: input.providerId,
      providerInstanceId: input.providerInstanceId ?? null,
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
