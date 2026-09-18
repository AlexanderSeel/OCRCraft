import "server-only";

import { getConfiguredAiExerciseDraftProvider } from "./ai-exercise-draft-provider";
import {
  aiExerciseDraftRequestSchema,
  type AiExerciseDraftRequest,
} from "./ai-exercise-draft-schema";
import { saveAiExerciseDraft } from "./ai-exercise-draft-repository";
import { reviewAiExerciseDraftProposal } from "./ai-exercise-draft-review-service";

export async function generateAiExerciseDraft(input: AiExerciseDraftRequest): Promise<string> {
  const request = aiExerciseDraftRequestSchema.parse(input);
  const provider = await getConfiguredAiExerciseDraftProvider();
  if (!provider) {
    throw new Error(
      "AI-Übungsentwürfe sind nicht konfiguriert. Setze OCRCRAFT_AI_BASE_URL und OCRCRAFT_AI_MODEL.",
    );
  }

  const proposal = await provider.generateExerciseDraft(request);
  const review = await reviewAiExerciseDraftProposal(proposal);
  return saveAiExerciseDraft(
    request.brief,
    provider.id,
    provider.modelId ?? null,
    proposal,
    review,
  );
}
