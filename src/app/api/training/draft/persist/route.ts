import { NextRequest, NextResponse } from "next/server";
import { createAndPersistDeterministicTrainingDraft } from "@/server/training/training-draft-service";
import { trainingDraftPersistenceSchema } from "@/server/training/training-draft-persistence-schema";

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

  const parsed = trainingDraftPersistenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid-training-persistence-request",
        message: "Der Trainingsentwurf kann mit diesen Angaben nicht gespeichert werden.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const result = await createAndPersistDeterministicTrainingDraft(parsed.data);
    return NextResponse.json({ id: result.id, draft: result.draft }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "training-persistence-failed",
        message: error instanceof Error ? error.message : "Trainingsentwurf konnte nicht gespeichert werden.",
      },
      { status: 422 },
    );
  }
}
