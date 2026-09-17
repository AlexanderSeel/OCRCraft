import { NextRequest, NextResponse } from "next/server";
import {
  createAndPersistDeterministicTrainingDraft,
  persistReviewedAiTrainingDraft,
} from "@/server/training/training-draft-service";
import { trainingDraftPersistenceSchema } from "@/server/training/training-draft-persistence-schema";
import { reviewedAiTrainingPersistenceSchema } from "@/server/training/reviewed-training-draft-schema";

export const dynamic = "force-dynamic";

function requestsAi(body: unknown): boolean {
  if (body == null || typeof body !== "object") return false;
  const request = (body as { readonly request?: unknown }).request;
  return request != null
    && typeof request === "object"
    && (request as { readonly builderMode?: unknown }).builderMode === "ai";
}

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

  const aiMode = requestsAi(body);
  const parsed = aiMode
    ? reviewedAiTrainingPersistenceSchema.safeParse(body)
    : trainingDraftPersistenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid-training-persistence-request",
        message: aiMode
          ? "Der geprüfte AI-Entwurf ist unvollständig oder wurde seit der Vorschau verändert."
          : "Der Trainingsentwurf kann mit diesen Angaben nicht gespeichert werden.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const result = aiMode
      ? await persistReviewedAiTrainingDraft(parsed.data as never)
      : await createAndPersistDeterministicTrainingDraft(parsed.data as never);
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
