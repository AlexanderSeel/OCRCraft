import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import type { TrainingEquipmentAvailability } from "@/domain/training/model";

/**
 * Applies hard candidate constraints that must be identical for local and AI
 * planning. Missing inventory entries mean "unknown" and therefore do not
 * exclude an exercise. An explicitly declared quantity must be sufficient to
 * set up at least one station; aggregate multi-station demand is validated later.
 */
export function filterCandidatesForDeclaredEquipment(
  candidates: readonly TrainingDraftExerciseCandidate[],
  availability: readonly TrainingEquipmentAvailability[],
): readonly TrainingDraftExerciseCandidate[] {
  if (availability.length === 0) return candidates;
  const stock = new Map(availability.map((item) => [item.equipmentId, item.quantityAvailable]));

  return candidates.filter((candidate) => candidate.equipmentRequirements.every((requirement) => {
    const declared = stock.get(requirement.equipmentId);
    return declared == null || declared >= requirement.quantityPerStation;
  }));
}
