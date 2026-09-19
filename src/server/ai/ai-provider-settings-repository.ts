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
  evaluateAiProviderRoutingState,
  evaluateAiUsageLimits,
  providerKindLabel,
  providerProtocol,
  providerSupportsCapability,
  providerSupportsOAuth,
  type AiCapability,
  type AiProviderAuthMode,
  type AiProviderKind,
  type AiProviderProtocol,
  type AiProviderRoutingState,
} from "./ai-provider-core";
import {
  getGoogleAiProjectId,
  isAiProviderOAuthClientConfigured,
  refreshAiOAuthCredential,
  type AiOAuthCredential,
} from "./ai-oauth-service";
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
  readonly authMode: AiProviderAuthMode;
  readonly apiKeyEnv: string | null;
  readonly hasStoredApiKey: boolean;
  readonly environmentKeyAvailable: boolean;
  readonly oauthSupported: boolean;
  readonly oauthClientConfigured: boolean;
  readonly hasOAuthCredential: boolean;
  readonly oauthExpiresAt: string | null;
  readonly monthlyTextTokenLimit: number | null;
  readonly monthlyRequestLimit: number | null;
  readonly usage: AiProviderUsageSummary;
  readonly assignments: readonly AiProviderAssignmentView[];
  readonly keyStorageAvailable: boolean;
  readonly routingState: AiProviderRoutingState;
}

export interface ResolvedAiProvider {
  readonly instanceId: string | null;
  readonly providerId: string;
  readonly providerKind: AiProviderKind | "legacy";
  readonly protocol: AiProviderProtocol;
  readonly baseUrl: string;
  readonly modelId: string;
  readonly apiKey?: string;
  readonly authMode: AiProviderAuthMode;
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
  readonly authMode: AiProviderAuthMode;
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

function parseOAuthCredential(encrypted: string): AiOAuthCredential {
  const parsed = JSON.parse(decryptAiProviderSecret(encrypted)) as Partial<AiOAuthCredential>;
  if (typeof parsed.accessToken !== "string" || parsed.accessToken.length < 4) {
    throw new Error("Gespeichertes OAuth-Credential ist ungültig.");
  }
  return {
    accessToken: parsed.accessToken,
    refreshToken: typeof parsed.refreshToken === "string" ? parsed.refreshToken : undefined,
    expiresAt: typeof parsed.expiresAt === "string" ? parsed.expiresAt : undefined,
  };
}

function credentialExpiresSoon(credential: AiOAuthCredential): boolean {
  if (!credential.expiresAt) return false;
  const timestamp = Date.parse(credential.expiresAt);
  return Number.isFinite(timestamp) && timestamp <= Date.now() + 120_000;
}

async function persistOAuthCredential(
  instanceId: string,
  credential: AiOAuthCredential,
): Promise<void> {
  await withDuckDbConnection((connection) => connection.run(`
    UPDATE ai_provider_instances
    SET encrypted_oauth_credential=$encrypted,
        oauth_expires_at=$expiresAt::TIMESTAMP,
        updated_at=current_timestamp
    WHERE id=$id::UUID
  `, {
    id: instanceId,
    encrypted: encryptAiProviderSecret(JSON.stringify(credential)),
    expiresAt: credential.expiresAt ?? null,
  }));
}

async function resolveOAuthAccessToken(
  instanceId: string,
  providerKind: AiProviderKind,
  encrypted: string,
): Promise<string> {
  let credential = parseOAuthCredential(encrypted);
  if (!credentialExpiresSoon(credential)) return credential.accessToken;
  credential = await refreshAiOAuthCredential(providerKind, credential);
  await persistOAuthCredential(instanceId, credential);
  return credential.accessToken;
}

export async function listAiProviderSettings(): Promise<readonly AiProviderSettingsView[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const providersReader = await connection.runAndReadAll(`
      SELECT
        i.id::VARCHAR,i.provider_kind,i.protocol,i.display_name,i.enabled,
        i.base_url,i.text_model_id,i.image_model_id,i.auth_mode,i.api_key_env,
        CASE WHEN i.encrypted_api_key IS NULL OR trim(i.encrypted_api_key)='' THEN false ELSE true END,
        CASE WHEN i.encrypted_oauth_credential IS NULL OR trim(i.encrypted_oauth_credential)='' THEN false ELSE true END,
        i.oauth_expires_at::VARCHAR,
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
        i.encrypted_api_key,i.encrypted_oauth_credential,i.oauth_expires_at,
        i.monthly_text_token_limit,i.monthly_request_limit,i.created_at
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
      const authMode = String(row[8]) as AiProviderAuthMode;
      const hasStoredApiKey = Boolean(row[10]);
      const hasOAuthCredential = Boolean(row[11]);
      const environmentKeyAvailable = Boolean(envName && process.env[envName]?.trim());
      const monthlyTextTokenLimit = numberOrNull(row[13]);
      const monthlyRequestLimit = numberOrNull(row[14]);
      const usage = usageFromRow(row, 15);
      const providerAssignments = assignments.get(id) ?? [];
      const limits = evaluateAiUsageLimits({
        requests: usage.requests,
        totalTokens: usage.totalTokens,
        monthlyRequestLimit,
        monthlyTextTokenLimit,
      });
      const textModelId = row[6] == null ? null : String(row[6]);
      const imageModelId = row[7] == null ? defaultImageModel(providerKind) : String(row[7]);
      const enabled = Boolean(row[4]);

      return {
        id,
        providerKind,
        protocol: String(row[2]) as AiProviderProtocol,
        displayName: String(row[3]),
        enabled,
        baseUrl: row[5] == null ? defaultProviderBaseUrl(providerKind) : String(row[5]),
        textModelId,
        imageModelId,
        authMode,
        apiKeyEnv: envName,
        hasStoredApiKey,
        environmentKeyAvailable,
        oauthSupported: providerSupportsOAuth(providerKind),
        oauthClientConfigured: isAiProviderOAuthClientConfigured(providerKind) && canStoreAiProviderSecret(),
        hasOAuthCredential,
        oauthExpiresAt: row[12] == null ? null : String(row[12]),
        monthlyTextTokenLimit,
        monthlyRequestLimit,
        usage,
        assignments: providerAssignments,
        keyStorageAvailable: canStoreAiProviderSecret(),
        routingState: evaluateAiProviderRoutingState({
          enabled,
          providerKind,
          authMode,
          environmentKeyAvailable,
          hasStoredApiKey,
          hasOAuthCredential,
          capabilities: providerAssignments.map((assignment) => assignment.capability),
          textModelId,
          imageModelId,
          requestLimitReached: limits.requestLimitReached,
          textTokenLimitReached: limits.textTokenLimitReached,
        }),
      };
    });
  });
}

export async function saveAiProviderInstance(input: SaveAiProviderInstanceInput): Promise<string> {
  const providerKind = aiProviderKindSchema.parse(input.providerKind);
  if (input.authMode === "oauth" && !providerSupportsOAuth(providerKind)) {
    throw new Error(providerKindLabel(providerKind) + " unterstützt in OCRCraft keinen OAuth-Login.");
  }

  const displayName = input.displayName.trim() || providerKindLabel(providerKind);
  const protocol = providerProtocol(providerKind);
  const baseUrl = providerKind === "openai-compatible"
    ? input.baseUrl?.trim() || null
    : defaultProviderBaseUrl(providerKind);
  const apiKeyEnv = input.apiKeyEnv?.trim() || defaultProviderKeyEnvironment(providerKind);
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
  if (protocol !== "copilot" && !baseUrl) {
    throw new Error("Für diesen Provider muss eine Base URL vorhanden sein.");
  }

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
        // DuckDB may reject updates on a parent row while assignment rows
        // still reference it. Remove the children first; the surrounding
        // transaction restores them if the provider update fails.
        await connection.run("DELETE FROM ai_provider_assignments WHERE provider_instance_id=$id::UUID", { id });
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
              encrypted_oauth_credential=CASE WHEN $authMode='oauth' THEN encrypted_oauth_credential ELSE NULL END,
              oauth_expires_at=CASE WHEN $authMode='oauth' THEN oauth_expires_at ELSE NULL END,
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

export async function getAiProviderOAuthTarget(id: string): Promise<{
  readonly id: string;
  readonly providerKind: AiProviderKind;
  readonly displayName: string;
}> {
  const instanceId = aiProviderInstanceIdSchema.parse(id);
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT id::VARCHAR,provider_kind,display_name
      FROM ai_provider_instances
      WHERE id=$id::UUID
      LIMIT 1
    `, { id: instanceId });
    const row = reader.getRows()[0];
    if (!row) throw new Error("AI-Instanz wurde nicht gefunden.");
    return {
      id: String(row[0]),
      providerKind: aiProviderKindSchema.parse(String(row[1])),
      displayName: String(row[2]),
    };
  });
}

export async function saveAiProviderOAuthCredential(
  id: string,
  credential: AiOAuthCredential,
  updatedBy: string,
): Promise<void> {
  const instanceId = aiProviderInstanceIdSchema.parse(id);
  if (!canStoreAiProviderSecret()) {
    throw new Error("OCRCRAFT_AI_SECRET_KEY ist für OAuth-Token nicht konfiguriert.");
  }
  const target = await getAiProviderOAuthTarget(instanceId);
  if (!providerSupportsOAuth(target.providerKind)) {
    throw new Error("OAuth ist für diese AI nicht verfügbar.");
  }
  await withDuckDbConnection((connection) => connection.run(`
    UPDATE ai_provider_instances
    SET auth_mode='oauth',
        encrypted_oauth_credential=$credential,
        oauth_expires_at=$expiresAt::TIMESTAMP,
        enabled=true,
        updated_by=$updatedBy::UUID,
        updated_at=current_timestamp
    WHERE id=$id::UUID
  `, {
    id: instanceId,
    credential: encryptAiProviderSecret(JSON.stringify(credential)),
    expiresAt: credential.expiresAt ?? null,
    updatedBy,
  }));
}

export async function disconnectAiProviderOAuth(id: string, updatedBy: string): Promise<void> {
  const instanceId = aiProviderInstanceIdSchema.parse(id);
  await ensureDatabaseReady();
  await withDuckDbConnection((connection) => connection.run(`
    UPDATE ai_provider_instances
    SET auth_mode='environment',
        encrypted_oauth_credential=NULL,
        oauth_expires_at=NULL,
        updated_by=$updatedBy::UUID,
        updated_at=current_timestamp
    WHERE id=$id::UUID
  `, { id: instanceId, updatedBy }));
}

export async function deleteAiProviderInstance(id: string): Promise<boolean> {
  const instanceId = aiProviderInstanceIdSchema.parse(id);
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    await connection.run("BEGIN TRANSACTION");
    try {
      await connection.run("DELETE FROM ai_provider_assignments WHERE provider_instance_id=$id::UUID", { id: instanceId });
      const result = await connection.runAndReadAll(
        "DELETE FROM ai_provider_instances WHERE id=$id::UUID RETURNING id::VARCHAR",
        { id: instanceId },
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
        i.encrypted_oauth_credential,i.monthly_text_token_limit,i.monthly_request_limit,a.priority
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
      monthlyRequestLimit: numberOrNull(row[12]),
      monthlyTextTokenLimit: numberOrNull(row[11]),
    });
    if (limits.requestLimitReached || limits.textTokenLimitReached) continue;

    const protocol = String(row[2]) as AiProviderProtocol;
    const baseUrl = row[4] == null ? defaultProviderBaseUrl(providerKind) : String(row[4]).trim();
    const modelId = capability === "image"
      ? row[6] == null ? defaultImageModel(providerKind) : String(row[6]).trim()
      : row[5] == null ? null : String(row[5]).trim();
    if ((!baseUrl && protocol !== "copilot") || !modelId) continue;

    const authMode = String(row[7]) as AiProviderAuthMode;
    let apiKey: string | undefined;
    try {
      if (authMode === "encrypted_key") {
        const encrypted = row[9] == null ? "" : String(row[9]);
        if (!encrypted) continue;
        apiKey = decryptAiProviderSecret(encrypted);
      } else if (authMode === "oauth") {
        const encrypted = row[10] == null ? "" : String(row[10]);
        if (!encrypted || !providerSupportsOAuth(providerKind)) continue;
        apiKey = await resolveOAuthAccessToken(instanceId, providerKind, encrypted);
      } else {
        const envName = row[8] == null ? "" : String(row[8]).trim();
        apiKey = envName ? process.env[envName]?.trim() || undefined : undefined;
      }
    } catch {
      continue;
    }
    if (providerKind !== "openai-compatible" && !apiKey) continue;

    resolved.push({
      instanceId,
      providerId: String(row[3]),
      providerKind,
      protocol,
      baseUrl: baseUrl ?? "",
      modelId,
      apiKey,
      authMode,
      priority: Number(row[13]),
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
      authMode: "environment",
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
        authMode: "environment",
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
  readonly authMode?: AiProviderAuthMode;
  readonly apiKeyEnv?: string | null;
  readonly apiKey?: string | null;
}): Promise<{
  readonly providerKind: AiProviderKind;
  readonly baseUrl: string | null;
  readonly apiKey?: string;
  readonly authMode: AiProviderAuthMode;
  readonly googleProjectId: string | null;
}> {
  let stored: readonly unknown[] | null = null;
  let instanceId: string | null = null;
  if (input.instanceId) {
    instanceId = aiProviderInstanceIdSchema.parse(input.instanceId);
    await ensureDatabaseReady();
    stored = await withDuckDbConnection(async (connection) => {
      const reader = await connection.runAndReadAll(`
        SELECT provider_kind,base_url,auth_mode,api_key_env,encrypted_api_key,encrypted_oauth_credential
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
  const authMode = input.authMode
    ?? (stored ? String(stored[2]) as AiProviderAuthMode : "environment");
  if (explicitKey) {
    return { providerKind, baseUrl, apiKey: explicitKey, authMode, googleProjectId: getGoogleAiProjectId() };
  }

  if (authMode === "encrypted_key") {
    const encrypted = stored?.[4] == null ? "" : String(stored[4]);
    return {
      providerKind,
      baseUrl,
      apiKey: encrypted ? decryptAiProviderSecret(encrypted) : undefined,
      authMode,
      googleProjectId: getGoogleAiProjectId(),
    };
  }
  if (authMode === "oauth") {
    const encrypted = stored?.[5] == null ? "" : String(stored[5]);
    return {
      providerKind,
      baseUrl,
      apiKey: encrypted && instanceId
        ? await resolveOAuthAccessToken(instanceId, providerKind, encrypted)
        : undefined,
      authMode,
      googleProjectId: getGoogleAiProjectId(),
    };
  }

  const envName = input.apiKeyEnv?.trim()
    || (stored?.[3] == null ? null : String(stored[3]).trim())
    || defaultProviderKeyEnvironment(providerKind);
  return {
    providerKind,
    baseUrl,
    apiKey: envName ? process.env[envName]?.trim() || undefined : undefined,
    authMode,
    googleProjectId: getGoogleAiProjectId(),
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
