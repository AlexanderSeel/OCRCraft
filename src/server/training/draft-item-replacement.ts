import "server-only";

import { isBodyRegion } from "../../domain/body-regions";
import type { TrainingDraft, TrainingDraftExerciseCandidate } from "../../domain/training/draft";
import { TRAINING_PHASE_LABELS, type TrainingPhase, type TrainingSession } from "../../domain/training/model";
import { validateTrainingSession } from "../../domain/training/validation";
import { rankDraftExerciseAlternatives } from "./draft-item-alternative";
import type { DraftItemReplacementRequest } from "./draft-item-replacement-schema";
import { filterCandidatesForDeclaredEquipment } from "./training-candidate-constraints";
import { listTrainingDraftCandidates } from "./training-draft-repository";

export async function replaceDraftExerciseWithAlternative(
  input: DraftItemReplacementRequest,
): Promise<TrainingDraft> {
  const { request, current, exerciseId, mode } = input;
  const rawCandidates = await listTrainingDraftCandidates({
    audience: request.audience,
    minAge: request.minAge,
    locale: request.locale,
    location: request.location,
  });
  const candidates = filterCandidatesForDeclaredEquipment(rawCandidates, request.availableEquipment);
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const currentCandidate = candidateById.get(exerciseId);
  if (!currentCandidate) throw new Error("Die ausgewählte Übung ist nicht mehr im freigegebenen Übungspool oder passt nicht zum deklarierten Equipment.");

  const phase = current.phases.find((candidatePhase) =>
    candidatePhase.items.some((item) => item.exerciseId === exerciseId),
  );
  if (!phase) throw new Error("Die ausgewählte Übung ist im aktuellen Entwurf nicht enthalten.");

  const usedIds = new Set(
    current.phases.flatMap((candidatePhase) =>
      candidatePhase.items.flatMap((item) => item.exerciseId === exerciseId ? [] : [item.exerciseId]),
    ),
  );
  const alternatives = rankDraftExerciseAlternatives(
    currentCandidate,
    candidates,
    phase.kind,
    mode,
    usedIds,
    request.avoidBodyRegions,
    1,
  );
  const replacement = alternatives[0];
  if (!replacement) throw new Error("Für diese Übung wurde keine passende Alternative gefunden.");

  const phases: TrainingPhase[] = current.phases.map((currentPhase) => ({
    id: `adjusted-${currentPhase.kind}`,
    kind: currentPhase.kind,
    title: TRAINING_PHASE_LABELS[currentPhase.kind],
    items: currentPhase.items.map((item) => {
      const candidate = item.exerciseId === exerciseId
        ? replacement.candidate
        : candidateById.get(item.exerciseId);
      if (!candidate) throw new Error(`Übung ${item.exerciseId} ist nicht mehr im freigegebenen Übungspool oder passt nicht zum deklarierten Equipment.`);
      return hydrateItem(
        candidate,
        currentPhase.kind,
        item.durationMinutes,
        item.format,
        item.exerciseId === exerciseId ? candidate.instructions : item.instructions,
        item.exerciseId === exerciseId ? candidate.level2 : item.levelLabel,
        item.mainPartIndex,
        item.mainPartTitle,
      );
    }),
  }));

  const session: TrainingSession = {
    id: "adjusted-training-draft",
    title: current.title,
    group: {
      id: "adjusted-training-group",
      name: request.builderMode === "ai" ? "AI Training Builder" : "Lokaler Sportalgorithmus",
      audience: request.audience,
      minAge: request.minAge,
      maxAge: request.maxAge,
      participantCount: request.participantCount,
      organizationMode: request.organizationMode,
      teamSize: request.organizationMode === "team" ? request.teamSize : undefined,
    },
    totalDurationMinutes: request.durationMinutes,
    focus: request.goals,
    phases,
  };

  return {
    source: request.builderMode === "ai" ? "ai" : "deterministic",
    session,
    validationIssues: validateTrainingSession(session, undefined, request.availableEquipment),
    warnings: [
      `${currentCandidate.name} wurde durch ${replacement.candidate.name} ersetzt: ${replacement.reason}.`,
    ],
  };
}

function hydrateItem(
  candidate: TrainingDraftExerciseCandidate,
  phase: TrainingPhase["kind"],
  durationMinutes: number,
  format: TrainingPhase["items"][number]["format"],
  instructions?: string,
  levelLabel?: string,
  mainPartIndex?: number,
  mainPartTitle?: string,
): TrainingPhase["items"][number] {
  return {
    id: `adjusted-${phase}-${candidate.id}`,
    exercise: {
      id: candidate.id,
      name: candidate.name,
      riskLevel: candidate.riskLevel,
      bodyRegions: candidate.bodyRegions.filter(isBodyRegion),
      equipment: candidate.equipment,
      equipmentRequirements: candidate.equipmentRequirements,
      stationCapacity: candidate.stationCapacity,
      setupSeconds: candidate.setupSeconds ?? undefined,
      transitionSeconds: candidate.transitionSeconds ?? undefined,
    },
    durationMinutes,
    format,
    instructions,
    levelLabel,
    ...(phase === "main"
      ? {
          mainPartIndex: mainPartIndex ?? 1,
          mainPartTitle: mainPartTitle || `Hauptteil ${mainPartIndex ?? 1}`,
        }
      : {}),
  };
}
