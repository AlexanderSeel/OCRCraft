import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/identity-service";
import { exportPortableData } from "@/server/db/portable-data-service";
import { portableSectionSchema, type PortableSection } from "@/server/db/portable-data-core";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await requireAdmin();
    const raw = request.nextUrl.searchParams.getAll("section");
    const sections = raw.length ? raw.flatMap((value) => value.split(",")) : ["exercises", "details", "mapping", "trainings", "groups", "media", "provenance"];
    const selected = sections.flatMap((value) => { const result = portableSectionSchema.safeParse(value); return result.success ? [result.data] : []; }) as PortableSection[];
    if (!selected.length) return Response.json({ error: "At least one valid section is required." }, { status: 400 });
    const payload = await exportPortableData(selected, { includeBinary: request.nextUrl.searchParams.get("includeBinary") === "1" });
    return new Response(JSON.stringify(payload, null, 2), { headers: { "content-disposition": `attachment; filename="ocrcraft-export-${new Date().toISOString().slice(0, 10)}.json"`, "content-type": "application/json; charset=utf-8" } });
  } catch {
    return Response.json({ error: "Export is not authorized or failed." }, { status: 403 });
  }
}
