import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/identity-service";
import {
  codexImageP1BatchSeedKeys,
  isCodexImageP1BatchId,
} from "@/server/images/codex-image-p1-batches";
import { buildCodexImageReviewExport } from "@/server/images/codex-image-task-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await requireAdmin();
    const batchValue = request.nextUrl.searchParams.get("batch")?.trim() ?? "";
    if (batchValue && !isCodexImageP1BatchId(batchValue)) {
      return Response.json({ error: "Unknown Codex image batch." }, { status: 400 });
    }
    const batch = batchValue && isCodexImageP1BatchId(batchValue) ? batchValue : null;
    const payload = await buildCodexImageReviewExport({
      seedKeys: batch ? codexImageP1BatchSeedKeys(batch) : [],
    });
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "content-disposition": `attachment; filename="ocrcraft-codex-image-review${batch ? `-${batch}` : ""}.json"`,
        "content-type": "application/json; charset=utf-8",
      },
    });
  } catch {
    return Response.json({ error: "Codex image review export is not authorized or failed." }, { status: 403 });
  }
}
