import {
  bodyRegionParent,
  bodyRegionsOverlap,
  getBodyRegionAntagonists,
  normalizeBodyRegionId,
} from "../../domain/body-regions";
import type { TrainingDraft, TrainingDraftExerciseCandidate } from "../../domain/training/draft";
import type { TrainingDraftRequest } from "./training-draft-schema";

export interface TrainingSportsQualityResult {
  readonly score: number;
  readonly warnings: readonly string[];
  readonly checks: readonly string[];
}

const MOVEMENT_COUNTERPARTS: Readonly<Record<string, readonly string[]>> = {
  push: ["pull"],
  pull: ["push"],
  squat: ["hinge"],
  hinge: ["squat"],
  rotate: ["brace"],
  brace: ["rotate"],
};

const UPPER_BODY = new Set([
  "neck", "traps", "shoulders", "rear-delts", "chest", "upper-back", "lats",
  "upper-arms", "biceps", "triceps", "forearms-grip",
]);
const CORE_BODY = new Set(["core", "abs", "obliques", "serratus", "lower-back"]);
const LOWER_BODY = new Set([
  "hips", "glutes", "quadriceps", "hamstrings", "adductors", "calves", "tibialis", "ankles-feet",
]);

/**
 * Deterministic post-composition audit shared by local and AI builders.
 * This does not diagnose medical suitability. It checks training-plan structure,
 * requested coverage, basic movement/muscle balance and load sequencing.
 */
export function assessTrainingSportsQuality(
  request: TrainingDraftRequest,
  draft: TrainingDraft,
  candidates: readonly TrainingDraftExerciseCandidate[],
): TrainingSportsQualityResult {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const selected = draft.session.phases.flatMap((phase) =>
    phase.items.flatMap((item) => byId.get(item.exercise.id) ?? []),
  );
  const main = draft.session.phases
    .find((phase) => phase.kind === "main")
    ?.items.flatMap((item) => byId.get(item.exercise.id) ?? []) ?? [];

  const warnings: string[] = [];
  const checks: string[] = [];
  let score = 100;

  for (const focus of request.bodyRegions) {
    if (selected.some((candidate) => bodyRegionsOverlap([focus], candidate.bodyRegions))) {
      checks.push(`Körperfokus ${focus} abgedeckt.`);
    } else {
      warnings.push(`Sportqualitätscheck: gewünschter Körperfokus ${focus} fehlt im Entwurf.`);
      score -= 12;
    }
  }

  for (const type of request.exerciseTypes) {
    if (selected.some((candidate) => candidate.exerciseType === type)) {
      checks.push(`Übungstyp ${type} abgedeckt.`);
    } else {
      warnings.push(`Sportqualitätscheck: gewünschter Übungstyp ${type} fehlt im Entwurf.`);
      score -= 10;
    }
  }

  if (isWholeBodyGoal(request.goals) && main.length >= 3) {
    const macros = new Set(main.flatMap(macroRegions));
    const missing = ["upper", "core", "lower"].filter((macro) => !macros.has(macro));
    if (missing.length > 0) {
      warnings.push(`Sportqualitätscheck: Ganzkörper-Ziel ohne vollständige Makro-Abdeckung (${missing.join(", ")} fehlt).`);
      score -= missing.length * 8;
    } else {
      checks.push("Ganzkörper-Ziel deckt Oberkörper, Core und Unterkörper ab.");
    }
  }

  if (main.length >= 3) {
    const patterns = new Set(main.flatMap((candidate) => candidate.movementPatterns ?? []));
    for (const [pattern, counterparts] of Object.entries(MOVEMENT_COUNTERPARTS)) {
      if (!patterns.has(pattern)) continue;
      if (counterparts.some((counterpart) => patterns.has(counterpart))) continue;
      warnings.push(`Sportqualitätscheck: Bewegungsmuster ${pattern} ohne ausgleichendes Gegenmuster ${counterparts.join("/")}.`);
      score -= 5;
    }

    for (const focus of request.bodyRegions) {
      const normalized = normalizeBodyRegionId(focus);
      if (!normalized) continue;
      const antagonists = getBodyRegionAntagonists(normalized);
      if (antagonists.length === 0) continue;
      const focusUsed = main.some((candidate) => bodyRegionsOverlap([focus], candidate.bodyRegions));
      const antagonistUsed = main.some((candidate) => antagonists.some((antagonist) =>
        bodyRegionsOverlap([antagonist], candidate.bodyRegions),
      ));
      if (focusUsed && !antagonistUsed) {
        warnings.push(`Sportqualitätscheck: ${focus} wird fokussiert, aber kein typischer Gegenmuskel ist im Hauptteil vertreten.`);
        score -= 4;
      }
    }
  }

  for (let index = 1; index < main.length; index += 1) {
    const previous = main[index - 1];
    const current = main[index];
    if (previous.impactLevel === "high" && current.impactLevel === "high") {
      warnings.push(`Sportqualitätscheck: zwei High-Impact-Übungen direkt hintereinander (${previous.name} → ${current.name}).`);
      score -= 8;
    }
    if (previous.riskLevel === "high" && current.riskLevel === "high") {
      warnings.push(`Sportqualitätscheck: zwei Hochrisiko-Übungen direkt hintereinander (${previous.name} → ${current.name}).`);
      score -= 8;
    }
  }

  if (request.audience === "kids") {
    const unsuitable = selected.filter((candidate) =>
      candidate.difficulty === "advanced" || candidate.riskLevel === "high",
    );
    if (unsuitable.length > 0) {
      warnings.push(`Sportqualitätscheck: Kids-Entwurf enthält ${unsuitable.length} fortgeschrittene oder Hochrisiko-Auswahl(en).`);
      score -= Math.min(20, unsuitable.length * 8);
    }
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    warnings: [`Sportqualitätscheck: ${score}/100.`, ...warnings],
    checks,
  };
}

function isWholeBodyGoal(goals: readonly string[]): boolean {
  return goals.some((goal) => {
    const value = goal.toLocaleLowerCase("de-DE");
    return value.includes("ganzkörper") || value.includes("whole body") || value.includes("full body");
  });
}

function macroRegions(candidate: TrainingDraftExerciseCandidate): readonly string[] {
  const result = new Set<string>();
  for (const region of candidate.bodyRegions) {
    const normalized = normalizeBodyRegionId(region);
    if (!normalized) continue;
    const parent = bodyRegionParent(normalized);
    if (UPPER_BODY.has(parent)) result.add("upper");
    if (CORE_BODY.has(parent)) result.add("core");
    if (LOWER_BODY.has(parent)) result.add("lower");
  }
  return [...result];
}
