import type { TrainingDraft } from "@/domain/training/draft";
import type { MainPartProgramming } from "@/domain/training/model";
import type { TrainingDraftRequest } from "./training-draft-schema";

const STANDARD_PROGRAMMING: MainPartProgramming = { mode: "standard" };

/**
 * Applies trainer-owned block programming after exercise composition. The AI
 * and local planners may choose exercises, but may not rewrite interval/round/
 * ladder/every-X prescriptions selected by the trainer.
 */
export function applyMainPartProgramming(
  request: TrainingDraftRequest,
  draft: TrainingDraft,
): TrainingDraft {
  const configured = request.mainPartProgramming ?? [];
  const phases = draft.session.phases.map((phase) => {
    if (phase.kind !== "main") return phase;
    return {
      ...phase,
      items: phase.items.map((item) => {
        const index = Math.max(1, item.mainPartIndex ?? 1) - 1;
        return {
          ...item,
          programming: configured[index] ?? STANDARD_PROGRAMMING,
        };
      }),
    };
  });

  const programmingWarnings = buildProgrammingWarnings(phases.find((phase) => phase.kind === "main")?.items ?? []);
  return {
    ...draft,
    session: { ...draft.session, phases },
    warnings: [...draft.warnings, ...programmingWarnings],
  };
}

export function mainPartProgrammingLabel(programming: MainPartProgramming | undefined): string {
  if (!programming || programming.mode === "standard") return "Standard / frei programmiert";
  if (programming.mode === "interval") {
    return `${programming.workSeconds ?? 0}s Arbeit / ${programming.restSeconds ?? 0}s Pause`;
  }
  if (programming.mode === "rounds") {
    return `${programming.rounds ?? 1} Runden · ${programming.scoreMode === "time" ? "auf Zeit" : "auf Qualität"}`;
  }
  if (programming.mode === "ladder") {
    return `Ladder ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1} · +${programming.ladderStep ?? 1}`;
  }
  if (programming.mode === "reverse-ladder") {
    return `Reverse Ladder ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1} · -${programming.ladderStep ?? 1}`;
  }
  if (programming.mode === "pyramid") {
    return `Pyramide ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1}→${programming.ladderStart ?? 1} · Schritt ${programming.ladderStep ?? 1}`;
  }
  if (programming.mode === "chipper") return "Chipper · Übungen nacheinander vollständig abarbeiten";
  const unit = programming.everyUnit === "metres"
    ? "m"
    : programming.everyUnit === "minutes"
      ? "Min."
      : "Checkpoint";
  return programming.everyUnit === "checkpoint"
    ? `An jedem ${programming.everyValue ?? 1}. ${unit}`
    : `Alle ${programming.everyValue ?? 1} ${unit}`;
}

function buildProgrammingWarnings(
  items: readonly TrainingDraft["session"]["phases"][number]["items"][number][],
): readonly string[] {
  const warnings: string[] = [];
  const blockIndices = [...new Set(items.map((item) => item.mainPartIndex ?? 1))].sort((a, b) => a - b);
  for (const blockIndex of blockIndices) {
    const blockItems = items.filter((item) => (item.mainPartIndex ?? 1) === blockIndex);
    const programming = blockItems[0]?.programming;
    if (!programming || programming.mode !== "interval") continue;
    const blockSeconds = blockItems.reduce((sum, item) => sum + item.durationMinutes * 60, 0);
    const cycleSeconds = (programming.workSeconds ?? 0) + (programming.restSeconds ?? 0);
    if (cycleSeconds <= 0) continue;
    const cycles = Math.floor(blockSeconds / cycleSeconds);
    const remainder = blockSeconds % cycleSeconds;
    if (cycles < 1) {
      warnings.push(`Hauptteil ${blockIndex}: das gewählte Intervall ist länger als der gesamte Block.`);
    } else if (remainder >= 15) {
      warnings.push(`Hauptteil ${blockIndex}: ${cycles} vollständige Intervalle passen in den Block; ${remainder}s bleiben für Übergang/Erklärung.`);
    }
  }
  return warnings;
}
