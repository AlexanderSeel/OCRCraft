import "server-only";

import {
  combineClubTrainingRules,
  impactAllowedByClubRules,
  riskAllowedByClubRules,
} from "@/domain/training/club-rules";
import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import {
  DEFAULT_CLUB_TRAINING_RULES,
  type ClubTrainingRules,
} from "@/domain/training/validation";
import { getClubGroupRuleSettings } from "@/server/groups/group-repository";
import type { TrainingDraftRequest } from "./training-draft-schema";

export async function resolveTrainingClubRules(
  request: TrainingDraftRequest,
): Promise<ClubTrainingRules> {
  if (!request.groupId) return DEFAULT_CLUB_TRAINING_RULES;

  const settings = await getClubGroupRuleSettings(request.groupId);
  if (!settings) {
    throw new Error("Die ausgewählte Trainingsgruppe ist nicht mehr aktiv.");
  }

  return combineClubTrainingRules(
    settings.ruleProfile,
    settings.maximumRiskLevel,
  );
}

export function filterCandidatesForClubRules(
  request: TrainingDraftRequest,
  candidates: readonly TrainingDraftExerciseCandidate[],
  rules: ClubTrainingRules,
): readonly TrainingDraftExerciseCandidate[] {
  return candidates.filter((candidate) =>
    riskAllowedByClubRules(candidate.riskLevel, rules)
    && impactAllowedByClubRules(
      request.audience,
      candidate.impactLevel,
      rules,
    )
  );
}
