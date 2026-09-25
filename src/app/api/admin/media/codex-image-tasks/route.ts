import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/identity-service";
import { buildCodexImageTaskExport } from "@/server/images/codex-image-task-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await requireAdmin();
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const payload = await buildCodexImageTaskExport({ query, limit: 1000 });
    const suffix = query ? "-filtered" : "";
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
