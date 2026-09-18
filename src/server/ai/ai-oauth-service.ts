import "server-only";

import type { AiProviderKind } from "./ai-provider-core";

export interface AiOAuthCredential {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresAt?: string;
}

export function getGoogleAiProjectId(): string | null {
  return process.env.OCRCRAFT_GOOGLE_PROJECT_ID?.trim() || null;
}

export function isAiProviderOAuthClientConfigured(kind: AiProviderKind): boolean {
  if (kind === "gemini") {
    return Boolean(
      process.env.OCRCRAFT_GOOGLE_OAUTH_CLIENT_ID?.trim()
      && process.env.OCRCRAFT_GOOGLE_OAUTH_CLIENT_SECRET?.trim()
      && getGoogleAiProjectId(),
    );
  }
  if (kind === "copilot") {
    return Boolean(
      process.env.OCRCRAFT_GITHUB_OAUTH_CLIENT_ID?.trim()
      && process.env.OCRCRAFT_GITHUB_OAUTH_CLIENT_SECRET?.trim(),
    );
  }
  return false;
}

export function getAiOAuthRedirectUri(requestOrigin: string): string {
  const configured = process.env.OCRCRAFT_PUBLIC_BASE_URL?.trim();
  const base = configured || requestOrigin;
  return new URL("/api/admin/ai/oauth/callback", base).toString();
}

export function buildAiOAuthAuthorizationUrl(input: {
  readonly providerKind: AiProviderKind;
  readonly state: string;
  readonly redirectUri: string;
}): string {
  if (input.providerKind === "gemini") {
    const clientId = process.env.OCRCRAFT_GOOGLE_OAUTH_CLIENT_ID?.trim();
    if (!clientId || !isAiProviderOAuthClientConfigured("gemini")) {
      throw new Error("Google OAuth ist nicht vollständig konfiguriert.");
    }
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", input.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", input.state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set(
      "scope",
      [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/generative-language.retriever",
      ].join(" "),
    );
    return url.toString();
  }

  if (input.providerKind === "copilot") {
    const clientId = process.env.OCRCRAFT_GITHUB_OAUTH_CLIENT_ID?.trim();
    if (!clientId || !isAiProviderOAuthClientConfigured("copilot")) {
      throw new Error("GitHub OAuth ist nicht vollständig konfiguriert.");
    }
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", input.redirectUri);
    url.searchParams.set("state", input.state);
    return url.toString();
  }

  throw new Error("OAuth ist für diesen AI-Provider nicht verfügbar.");
}

function expiresAt(seconds: number | undefined): string | undefined {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return undefined;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export async function exchangeAiOAuthCode(input: {
  readonly providerKind: AiProviderKind;
  readonly code: string;
  readonly redirectUri: string;
}): Promise<AiOAuthCredential> {
  if (input.providerKind === "gemini") {
    const clientId = process.env.OCRCRAFT_GOOGLE_OAUTH_CLIENT_ID?.trim();
    const clientSecret = process.env.OCRCRAFT_GOOGLE_OAUTH_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) throw new Error("Google OAuth Client-Konfiguration fehlt.");

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: input.code,
        grant_type: "authorization_code",
        redirect_uri: input.redirectUri,
      }),
    });
    const payload = await response.json().catch(() => null) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error_description?: string;
    } | null;
    if (!response.ok || !payload?.access_token) {
      throw new Error(payload?.error_description || "Google OAuth Code konnte nicht eingelöst werden.");
    }
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt: expiresAt(payload.expires_in),
    };
  }

  if (input.providerKind === "copilot") {
    const clientId = process.env.OCRCRAFT_GITHUB_OAUTH_CLIENT_ID?.trim();
    const clientSecret = process.env.OCRCRAFT_GITHUB_OAUTH_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) throw new Error("GitHub OAuth Client-Konfiguration fehlt.");

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: input.code,
        redirect_uri: input.redirectUri,
      }),
    });
    const payload = await response.json().catch(() => null) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error_description?: string;
      error?: string;
    } | null;
    if (!response.ok || !payload?.access_token) {
      throw new Error(payload?.error_description || payload?.error || "GitHub OAuth Code konnte nicht eingelöst werden.");
    }
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt: expiresAt(payload.expires_in),
    };
  }

  throw new Error("OAuth ist für diesen AI-Provider nicht verfügbar.");
}

export async function refreshAiOAuthCredential(
  providerKind: AiProviderKind,
  credential: AiOAuthCredential,
): Promise<AiOAuthCredential> {
  if (!credential.refreshToken) {
    throw new Error("OAuth-Zugang ist abgelaufen und besitzt keinen Refresh-Token.");
  }

  if (providerKind === "gemini") {
    const clientId = process.env.OCRCRAFT_GOOGLE_OAUTH_CLIENT_ID?.trim();
    const clientSecret = process.env.OCRCRAFT_GOOGLE_OAUTH_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) throw new Error("Google OAuth Client-Konfiguration fehlt.");
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: credential.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const payload = await response.json().catch(() => null) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    } | null;
    if (!response.ok || !payload?.access_token) {
      throw new Error("Google OAuth Token konnte nicht erneuert werden.");
    }
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? credential.refreshToken,
      expiresAt: expiresAt(payload.expires_in),
    };
  }

  if (providerKind === "copilot") {
    const clientId = process.env.OCRCRAFT_GITHUB_OAUTH_CLIENT_ID?.trim();
    const clientSecret = process.env.OCRCRAFT_GITHUB_OAUTH_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) throw new Error("GitHub OAuth Client-Konfiguration fehlt.");
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: credential.refreshToken,
      }),
    });
    const payload = await response.json().catch(() => null) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    } | null;
    if (!response.ok || !payload?.access_token) {
      throw new Error("GitHub OAuth Token konnte nicht erneuert werden.");
    }
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? credential.refreshToken,
      expiresAt: expiresAt(payload.expires_in),
    };
  }

  throw new Error("OAuth-Refresh ist für diesen AI-Provider nicht verfügbar.");
}
