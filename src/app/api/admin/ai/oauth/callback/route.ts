import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/identity-service";
import { recordAuditEvent } from "@/server/db/audit-service";
import {
  getAiProviderOAuthTarget,
  saveAiProviderOAuthCredential,
} from "@/server/ai/ai-provider-settings-repository";
import {
  exchangeAiOAuthCode,
  getAiOAuthRedirectUri,
} from "@/server/ai/ai-oauth-service";
import type { AiProviderKind } from "@/server/ai/ai-provider-core";

const COOKIE_NAME = "ocrcraft-ai-oauth-state";

interface OAuthState {
  readonly state: string;
  readonly instanceId: string;
  readonly providerKind: AiProviderKind;
}

function parseState(value: string | undefined): OAuthState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<OAuthState>;
    if (!parsed.state || !parsed.instanceId || !parsed.providerKind) return null;
    return parsed as OAuthState;
  } catch {
    return null;
  }
}

function redirectToSettings(request: NextRequest, success: boolean): NextResponse {
  const query = success ? "aiSaved=oauth" : "aiError=oauth";
  const response = NextResponse.redirect(new URL("/admin?tab=settings&" + query + "#ai-provider-settings", request.url));
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireAdmin();
    const expected = parseState(request.cookies.get(COOKIE_NAME)?.value);
    const state = request.nextUrl.searchParams.get("state");
    const code = request.nextUrl.searchParams.get("code");
    const providerError = request.nextUrl.searchParams.get("error");
    if (!expected || !state || state !== expected.state || !code || providerError) {
      return redirectToSettings(request, false);
    }

    const target = await getAiProviderOAuthTarget(expected.instanceId);
    if (target.providerKind !== expected.providerKind) {
      return redirectToSettings(request, false);
    }

    const credential = await exchangeAiOAuthCode({
      providerKind: target.providerKind,
      code,
      redirectUri: getAiOAuthRedirectUri(request.nextUrl.origin),
    });
    await saveAiProviderOAuthCredential(target.id, credential, actor.id);
    await recordAuditEvent({
      action: "ai_provider.oauth.connect",
      entityType: "ai_provider_instance",
      entityId: target.id,
      actorType: "user",
      actorId: actor.id,
      metadata: { providerKind: target.providerKind },
    });
    return redirectToSettings(request, true);
  } catch {
    return redirectToSettings(request, false);
  }
}
