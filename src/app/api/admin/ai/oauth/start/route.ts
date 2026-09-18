import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/identity-service";
import {
  getAiProviderOAuthTarget,
} from "@/server/ai/ai-provider-settings-repository";
import {
  buildAiOAuthAuthorizationUrl,
  getAiOAuthRedirectUri,
  isAiProviderOAuthClientConfigured,
} from "@/server/ai/ai-oauth-service";
import { providerSupportsOAuth } from "@/server/ai/ai-provider-core";

const COOKIE_NAME = "ocrcraft-ai-oauth-state";

function settingsRedirect(request: NextRequest, code: string): NextResponse {
  return NextResponse.redirect(new URL("/admin?tab=settings&aiError=" + code + "#ai-provider-settings", request.url));
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const instanceId = request.nextUrl.searchParams.get("instanceId");
    if (!instanceId) return settingsRedirect(request, "oauth");
    const target = await getAiProviderOAuthTarget(instanceId);
    if (!providerSupportsOAuth(target.providerKind) || !isAiProviderOAuthClientConfigured(target.providerKind)) {
      return settingsRedirect(request, "oauth-config");
    }

    const state = randomBytes(24).toString("base64url");
    const redirectUri = getAiOAuthRedirectUri(request.nextUrl.origin);
    const authorizationUrl = buildAiOAuthAuthorizationUrl({
      providerKind: target.providerKind,
      state,
      redirectUri,
    });
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(
      COOKIE_NAME,
      Buffer.from(JSON.stringify({
        state,
        instanceId: target.id,
        providerKind: target.providerKind,
      }), "utf8").toString("base64url"),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60,
        path: "/api/admin/ai/oauth",
      },
    );
    return response;
  } catch {
    return settingsRedirect(request, "oauth");
  }
}
