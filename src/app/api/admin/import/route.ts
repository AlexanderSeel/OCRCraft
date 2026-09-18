import { requireSuperAdmin } from "@/server/auth/identity-service";
import { recordAuditEvent } from "@/server/db/audit-service";
import { importPortableData } from "@/server/db/portable-data-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await requireSuperAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Eine JSON-Datei ist erforderlich." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return Response.json({ error: "Die Importdatei darf höchstens 10 MB groß sein." }, { status: 413 });
    const result = await importPortableData(JSON.parse(await file.text()));
    await recordAuditEvent({ action: "database.portable_import", entityType: "database", actorType: "user", actorId: actor.id, metadata: { ...result } });
    return Response.json(result, { status: 200 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Import fehlgeschlagen." }, { status: 400 });
  }
}
