import { NextRequest, NextResponse } from "next/server";
import { replaceDraftExerciseWithAlternative } from "@/server/training/draft-item-replacement";
import { draftItemReplacementSchema } from "@/server/training/draft-item-replacement-schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid-json", message: "Die Anfrage enthält kein gültiges JSON." },
      { status: 400 },
    );
  }

  const parsed = draftItemReplacementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid-draft-item-replacement",
        message: "Die Angaben für die Übungsalternative sind unvollständig oder ungültig.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await replaceDraftExerciseWithAlternative(parsed.data));
  } catch (error) {
    return NextResponse.json(
      {
        error: "draft-item-replacement-failed",
        message: error instanceof Error ? error.message : "Übungsalternative konnte nicht angewendet werden.",
      },
      { status: 422 },
    );
  }
}
