import { NextRequest, NextResponse } from "next/server";
import { createTrainingDraft } from "@/server/training/training-draft-service";
import { trainingDraftRequestSchema } from "@/server/training/training-draft-schema";

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

  const parsed = trainingDraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid-training-draft-request",
        message: "Die Quick-Create-Angaben sind unvollständig oder ungültig.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const draft = await createTrainingDraft(parsed.data);
    return NextResponse.json(draft);
  } catch (error) {
    return NextResponse.json(
      {
        error: parsed.data.builderMode === "ai" ? "ai-training-generation-failed" : "training-generation-failed",
        message: error instanceof Error ? error.message : "Trainingsentwurf konnte nicht erstellt werden.",
      },
      { status: 422 },
    );
  }
}
