import type { ExerciseTrainingGoal } from "@/domain/exercise/classification";
import type { TrainingDraft, TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import type { TrainingDraftRequest } from "./training-draft-schema";

const GOAL_TERMS: Readonly<Record<ExerciseTrainingGoal, readonly string[]>> = {
  strength: ["kraft", "strength"],
  strength_endurance: ["kraftausdauer", "strength endurance"],
  endurance: ["ausdauer", "endurance", "laufen", "running"],
  speed: ["schnelligkeit", "speed", "reaktion", "reaction"],
  coordination: ["koordination", "coordination"],
  balance: ["balance", "gleichgewicht"],
  mobility: ["mobilität", "mobility", "beweglichkeit"],
  grip: ["grip", "griff", "griffkraft"],
  ocr_technique: ["ocr", "ocr-technik", "ocr technik", "obstacle", "hindernis"],
  recovery: ["regeneration", "recovery", "cooldown"],
  teamwork: ["team", "teamwork", "partner"],
};

function mapRequestedGoal(value: string, locale: "de" | "en"): readonly ExerciseTrainingGoal[] {
  const normalized = value.trim().toLocaleLowerCase(locale === "en" ? "en-US" : "de-DE");
  const matches = (Object.entries(GOAL_TERMS) as [ExerciseTrainingGoal, readonly string[]][])
    .map(([goal, terms]) => ({
      goal,
      specificity: Math.max(0, ...terms.filter((term) => normalized.includes(term)).map((term) => term.length)),
    }))
    .filter((match) => match.specificity > 0);
  if (matches.length === 0) return [];

  // Compound goals such as "Kraftausdauer" also contain the broader term
  // "Kraft". Prefer the longest matching taxonomy term so a strength-only
  // exercise cannot accidentally satisfy strength-endurance.
  const mostSpecific = Math.max(...matches.map((match) => match.specificity));
  return matches.filter((match) => match.specificity === mostSpecific).map((match) => match.goal);
}

/**
 * Reports only goals that can be mapped to OCRCraft's structured training-goal
 * taxonomy. Free-form goals such as "Ganzkörper" are handled by the broader
 * body/category planning rules and therefore do not create false warnings here.
 */
export function assessStructuredTrainingGoalCoverage(
  request: TrainingDraftRequest,
  draft: TrainingDraft,
  candidates: readonly TrainingDraftExerciseCandidate[],
): readonly string[] {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const selected = draft.session.phases.flatMap((phase) =>
    phase.items.flatMap((item) => byId.get(item.exercise.id) ?? []),
  );
  const warnings: string[] = [];

  for (const requestedGoal of request.goals) {
    const mappedGoals = mapRequestedGoal(requestedGoal, request.locale);
    if (mappedGoals.length === 0) continue;
    if (selected.some((candidate) => candidate.trainingGoals?.some((goal) => mappedGoals.includes(goal)))) continue;

    warnings.push(
      `Trainingsziel ${requestedGoal} konnte mit den ausgewählten freigegebenen Übungen nicht strukturiert abgedeckt werden.`,
    );
  }

  return warnings;
}
