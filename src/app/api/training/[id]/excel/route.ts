import { NextResponse } from "next/server";
import { requireTrainer } from "@/server/auth/identity-service";
import { exportTrainingWorkbook } from "@/server/training/training-excel-service";
import { getTrainingSessionById } from "@/server/training/training-session-repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireTrainer();
    const { id } = await params;
    const session = await getTrainingSessionById(id);
    if (!session) return NextResponse.json({ error: "Training nicht gefunden." }, { status: 404 });
    const workbook = await exportTrainingWorkbook(session);
    const fileName = `${session.title.replace(/[^a-z0-9äöüß _-]/gi, "").trim() || "training"}.xlsx`;
    return new Response(workbook, {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Excel-Export nicht autorisiert oder fehlgeschlagen." }, { status: 403 });
  }
}
