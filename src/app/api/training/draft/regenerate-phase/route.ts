import { NextRequest, NextResponse } from "next/server";
import { regenerateTrainingDraftPhase } from "@/server/training/training-phase-regeneration";
import { trainingPhaseRegenerationSchema } from "@/server/training/training-phase-regeneration-schema";

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

  const parsed = trainingPhaseRegenerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid-phase-regeneration-request",
        message: "Die Angaben für die Phasen-Neuerstellung sind unvollständig oder ungültig.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await regenerateTrainingDraftPhase(parsed.data));
  } catch (error) {
    return NextResponse.json(
      {
        error: "phase-regeneration-failed",
        message: error instanceof Error ? error.message : "Phase konnte nicht neu erstellt werden.",
      },
      { status: 422 },
    );
  }
}
