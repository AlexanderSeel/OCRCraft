import "server-only";

import {
  combineClubTrainingRules,
  impactAllowedByClubRules,
  riskAllowedByClubRules,
} from "@/domain/training/club-rules";
import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import {
  trainerQualificationBlockReason,
} from "@/domain/training/trainer-qualification";
import {
  DEFAULT_CLUB_TRAINING_RULES,
  type ClubTrainingRules,
} from "@/domain/training/validation";
import { getClubGroupRuleSettings } from "@/server/groups/group-repository";
import { getYouthSafetyProfileForGroup } from "@/server/groups/youth-safety-profile-repository";
import { requireTrainer } from "@/server/auth/identity-service";
import type { TrainingDraftRequest } from "./training-draft-schema";

export async function resolveTrainingClubRules(
  request: TrainingDraftRequest,
): Promise<ClubTrainingRules> {
  if (!request.groupId) return DEFAULT_CLUB_TRAINING_RULES;

  const [settings, youthSafety] = await Promise.all([
    getClubGroupRuleSettings(request.groupId),
    getYouthSafetyProfileForGroup(request.groupId),
  ]);
  if (!settings) {
    throw new Error("Die ausgewählte Trainingsgruppe ist nicht mehr aktiv.");
  }

  return combineClubTrainingRules(
    settings.ruleProfile,
    settings.maximumRiskLevel,
    youthSafety,
  );
}

export function filterCandidatesForClubRules(
  request: TrainingDraftRequest,
  candidates: readonly TrainingDraftExerciseCandidate[],
  rules: ClubTrainingRules,
): readonly TrainingDraftExerciseCandidate[] {
  const restricted = new Set(rules.restrictedExerciseIds ?? []);
  const effectiveAudience = rules.safetyProfileAudience ?? request.audience;
  return candidates.filter((candidate) =>
    !restricted.has(candidate.id)
    && (rules.safetyMinimumAge == null
      || candidate.minAge == null
      || candidate.minAge <= rules.safetyMinimumAge)
    && riskAllowedByClubRules(candidate.riskLevel, rules)
    && impactAllowedByClubRules(
      effectiveAudience,
      candidate.impactLevel,
      rules,
    )
  );
}


export async function assertTrainerQualificationForRules(
  rules: ClubTrainingRules,
): Promise<void> {
  const required = rules.requiredTrainerQualification;
  if (!required || required === "none") return;
  const actor = await requireTrainer();
  const reason = trainerQualificationBlockReason(
    actor.trainerQualificationLevel,
    required,
    `Training mit Schutzprofil „${rules.safetyProfileName ?? "Kids/Youth"}“`,
  );
  if (reason) throw new Error(reason);
}
