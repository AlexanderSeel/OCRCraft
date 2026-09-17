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
 * requested coverage, preparation/recovery relevance, basic movement/muscle
 * balance and fatigue-sensitive load sequencing.
 */
export function assessTrainingSportsQuality(
  request: TrainingDraftRequest,
  draft: TrainingDraft,
  candidates: readonly TrainingDraftExerciseCandidate[],
): TrainingSportsQualityResult {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const phaseCandidates = (kind: "warmup" | "main" | "cooldown") =>
    draft.session.phases
      .find((phase) => phase.kind === kind)
      ?.items.flatMap((item) => byId.get(item.exercise.id) ?? []) ?? [];
  const warmup = phaseCandidates("warmup");
  const main = phaseCandidates("main");
  const cooldown = phaseCandidates("cooldown");
  const selected = [...warmup, ...main, ...cooldown];

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

  if (main.length > 0 && warmup.length > 0) {
    if (warmup.some((candidate) => preparesForMain(candidate, main))) {
      checks.push("Warm-up bereitet Bewegungsmuster oder belastete Körperregionen des Hauptteils vor.");
    } else {
      warnings.push("Sportqualitätscheck: Warm-up hat keinen erkennbaren Bezug zu Bewegungsmustern oder belasteten Körperregionen des Hauptteils.");
      score -= 8;
    }
  }

  if (cooldown.length > 0) {
    const unsuitableCooldown = cooldown.filter((candidate) =>
      candidate.riskLevel === "high"
      || candidate.impactLevel === "high"
      || candidate.exerciseType === "obstacle"
      || candidate.exerciseType === "strength",
    );
    if (unsuitableCooldown.length > 0) {
      warnings.push(`Sportqualitätscheck: Cooldown enthält ${unsuitableCooldown.length} hoch belastende oder ungeeignete Auswahl(en).`);
      score -= Math.min(14, unsuitableCooldown.length * 7);
    } else {
      checks.push("Cooldown vermeidet hohe Stoßbelastung und Hochrisiko-/Kraft-/Obstacle-Arbeit.");
    }

    if (main.length > 0 && !cooldown.some((candidate) => recoversMainDemand(candidate, main))) {
      warnings.push("Sportqualitätscheck: Cooldown reduziert zwar Belastung, adressiert aber keine im Hauptteil beanspruchte Körperregion und enthält keine allgemeine Recovery/Mobility-Option.");
      score -= 5;
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
    if (previous.impactLevel === "high" && current.coordinationComplexity === "complex") {
      warnings.push(`Sportqualitätscheck: komplexe Koordinationsaufgabe direkt nach High-Impact-Belastung (${previous.name} → ${current.name}).`);
      score -= 5;
    }

    const fatigueWindow = main.slice(Math.max(0, index - 2), index);
    if (isHighSkill(current) && fatigueWindow.length >= 2 && fatigueWindow.every(isFatigueHeavy)) {
      warnings.push(`Sportqualitätscheck: technisch/koordinativ anspruchsvolle Übung erst nach zwei ermüdenden Belastungen (${fatigueWindow.map((item) => item.name).join(" → ")} → ${current.name}).`);
      score -= 7;
    }
  }

  for (let index = 2; index < main.length; index += 1) {
    const window = main.slice(index - 2, index + 1);
    if (sharesRepeatedMacroLoad(window)) {
      warnings.push(`Sportqualitätscheck: drei aufeinanderfolgende Hauptteil-Übungen belasten denselben Körper-Makrobereich (${window.map((item) => item.name).join(" → ")}).`);
      score -= 5;
    }
    const sharedLocalRegions = sharedLocalBodyRegions(window);
    if (sharedLocalRegions.length > 0) {
      warnings.push(`Sportqualitätscheck: drei aufeinanderfolgende Hauptteil-Übungen belasten dieselbe lokale Region (${sharedLocalRegions.join(", ")}: ${window.map((item) => item.name).join(" → ")}).`);
      score -= 6;
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

function preparesForMain(
  candidate: TrainingDraftExerciseCandidate,
  main: readonly TrainingDraftExerciseCandidate[],
): boolean {
  if (candidate.bodyRegions.includes("full-body")) return true;
  const mainPatterns = new Set(main.flatMap((item) => item.movementPatterns ?? []));
  if ((candidate.movementPatterns ?? []).some((pattern) => mainPatterns.has(pattern))) return true;
  return main.some((item) => candidate.bodyRegions.some((region) => bodyRegionsOverlap([region], item.bodyRegions)));
}

function recoversMainDemand(
  candidate: TrainingDraftExerciseCandidate,
  main: readonly TrainingDraftExerciseCandidate[],
): boolean {
  if (candidate.exerciseType === "recovery" || candidate.exerciseType === "mobility") return true;
  if (candidate.bodyRegions.includes("full-body")) return true;
  return main.some((item) => candidate.bodyRegions.some((region) => bodyRegionsOverlap([region], item.bodyRegions)));
}

function isHighSkill(candidate: TrainingDraftExerciseCandidate): boolean {
  return candidate.exerciseType === "skill"
    || candidate.exerciseType === "obstacle"
    || candidate.coordinationComplexity === "complex";
}

function isFatigueHeavy(candidate: TrainingDraftExerciseCandidate): boolean {
  return candidate.impactLevel === "high"
    || candidate.exerciseType === "strength"
    || candidate.exerciseType === "endurance";
}

function sharedLocalBodyRegions(candidates: readonly TrainingDraftExerciseCandidate[]): readonly string[] {
  if (candidates.length < 3) return [];
  const regionSets = candidates.map((candidate) => new Set(
    candidate.bodyRegions
      .map((region) => normalizeBodyRegionId(region))
      .filter((region): region is NonNullable<typeof region> => region != null)
      .map(bodyRegionParent)
      .filter((region) => region !== "full-body"),
  ));
  return [...regionSets[0]].filter((region) => regionSets.slice(1).every((regions) => regions.has(region)));
}

function sharesRepeatedMacroLoad(candidates: readonly TrainingDraftExerciseCandidate[]): boolean {
  if (candidates.length < 3) return false;
  const macroSets = candidates.map((candidate) => new Set(macroRegions(candidate)));
  return [...macroSets[0]].some((macro) => macroSets.slice(1).every((macros) => macros.has(macro)));
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
