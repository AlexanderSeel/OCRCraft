import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/identity-service";
import { discoverAiModels } from "@/server/ai/ai-model-discovery";
import {
  aiProviderInstanceIdSchema,
  aiProviderKindSchema,
  getAiProviderDiscoveryConnection,
} from "@/server/ai/ai-provider-settings-repository";

const requestSchema = z.object({
  instanceId: aiProviderInstanceIdSchema.nullish(),
  providerKind: aiProviderKindSchema,
  baseUrl: z.string().trim().max(500).nullish(),
  authMode: z.enum(["environment","encrypted_key","oauth"]).optional(),
  apiKeyEnv: z.string().trim().max(120).nullish(),
  apiKey: z.string().trim().max(1000).nullish(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const parsed = requestSchema.parse(await request.json());
    const connection = await getAiProviderDiscoveryConnection(parsed);
    const result = await discoverAiModels(connection);
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({
      error: "model-discovery-failed",
      message: error instanceof Error ? error.message : "Modelle konnten nicht geladen werden.",
    }, { status: 400 });
  }
}
