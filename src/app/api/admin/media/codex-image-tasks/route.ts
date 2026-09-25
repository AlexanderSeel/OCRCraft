import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/identity-service";
import { buildCodexImageTaskExport } from "@/server/images/codex-image-task-service";
import {
  codexImageP1BatchSeedKeys,
  isCodexImageP1BatchId,
} from "@/server/images/codex-image-p1-batches";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await requireAdmin();
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const batch = request.nextUrl.searchParams.get("batch")?.trim() ?? "";
    if (batch && !isCodexImageP1BatchId(batch)) {
      return Response.json({ error: "Unknown Codex image batch." }, { status: 400 });
    }
    const seedKeys = batch ? codexImageP1BatchSeedKeys(batch) : [];
    const payload = await buildCodexImageTaskExport({ query, limit: 1000, seedKeys });
    const suffix = batch ? `-${batch}` : query ? "-filtered" : "";
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "content-disposition": `attachment; filename="ocrcraft-codex-image-tasks${suffix}.json"`,
        "content-type": "application/json; charset=utf-8",
      },
    });
  } catch {
    return Response.json({ error: "Codex image task export is not authorized or failed." }, { status: 403 });
  }
}
