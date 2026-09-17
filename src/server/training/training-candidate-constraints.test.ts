import { describe, expect, it } from "vitest";
import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import { filterCandidatesForDeclaredEquipment } from "./training-candidate-constraints";

function candidate(id: string, equipmentId?: string, quantityPerStation = 1): TrainingDraftExerciseCandidate {
  return {
    id,
    name: id,
    category: "strength",
    defaultPhase: "main",
    riskLevel: "low",
    minAge: null,
    bodyRegions: ["core"],
    equipment: equipmentId ? [equipmentId] : [],
    equipmentRequirements: equipmentId ? [{ equipmentId, name: equipmentId, quantityPerStation }] : [],
    stationCapacity: 4,
    tags: [],
    defaultDurationSeconds: 180,
  };
}

describe("training candidate declared equipment constraints", () => {
  it("keeps unknown inventory but excludes explicitly insufficient stock", () => {
    const candidates = [
      candidate("bodyweight"),
      candidate("rope", "rope", 1),
      candidate("two-bags", "bag", 2),
      candidate("unknown", "box", 1),
    ];

    expect(filterCandidatesForDeclaredEquipment(candidates, [
      { equipmentId: "rope", quantityAvailable: 0 },
      { equipmentId: "bag", quantityAvailable: 1 },
    ]).map((item) => item.id)).toEqual(["bodyweight", "unknown"]);
  });

  it("keeps candidates when one complete station can be built", () => {
    expect(filterCandidatesForDeclaredEquipment(
      [candidate("two-bags", "bag", 2)],
      [{ equipmentId: "bag", quantityAvailable: 2 }],
    )).toHaveLength(1);
  });
});
