import type { TrainingDraft } from "@/domain/training/draft";
import type { MainPartProgramming, PartnerWorkMode } from "@/domain/training/model";
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
        const baseProgramming = configured[index] ?? STANDARD_PROGRAMMING;
        return {
          ...item,
          programming: request.formats.includes("partner")
            ? withPartnerDefaults(baseProgramming)
            : baseProgramming,
        };
      }),
    };
  });

  const programmingWarnings = buildProgrammingWarnings(
    phases.find((phase) => phase.kind === "main")?.items ?? [],
    request.participantCount,
    request.formats.includes("partner"),
  );
  return {
    ...draft,
    session: { ...draft.session, phases },
    warnings: [...draft.warnings, ...programmingWarnings],
  };
}

export function mainPartProgrammingLabel(programming: MainPartProgramming | undefined): string {
  if (!programming) return "Standard / frei programmiert";
  let base = "Standard / frei programmiert";
  if (programming.mode === "interval") {
    base = `${programming.workSeconds ?? 0}s Arbeit / ${programming.restSeconds ?? 0}s Pause`;
  } else if (programming.mode === "rounds") {
    base = `${programming.rounds ?? 1} Runden · ${programming.scoreMode === "time" ? "auf Zeit" : "auf Qualität"}`;
  } else if (programming.mode === "ladder") {
    base = `Ladder ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1} · +${programming.ladderStep ?? 1}`;
  } else if (programming.mode === "reverse-ladder") {
    base = `Reverse Ladder ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1} · -${programming.ladderStep ?? 1}`;
  } else if (programming.mode === "pyramid") {
    base = `Pyramide ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1}→${programming.ladderStart ?? 1} · Schritt ${programming.ladderStep ?? 1}`;
  } else if (programming.mode === "chipper") {
    base = "Chipper · Übungen nacheinander vollständig abarbeiten";
  } else if (programming.mode === "every") {
    const unit = programming.everyUnit === "metres" ? "m" : programming.everyUnit === "minutes" ? "Min." : "Checkpoint";
    base = programming.everyUnit === "checkpoint"
      ? `An jedem ${programming.everyValue ?? 1}. ${unit}`
      : `Alle ${programming.everyValue ?? 1} ${unit}`;
  }
  return programming.partnerMode
    ? `${base} · ${partnerWorkModeLabel(programming.partnerMode, programming.partnerSwitchSeconds)}`
    : base;
}

function partnerWorkModeLabel(mode: PartnerWorkMode, switchSeconds?: number): string {
  if (mode === "synchronized") return "Partner: synchron";
  if (mode === "alternating") return `Partner: Wechsel alle ${switchSeconds ?? 30}s`;
  if (mode === "shared-target") return "Partner: gemeinsames Ziel";
  return "Partner: You-go-I-go";
}

function withPartnerDefaults(programming: MainPartProgramming): MainPartProgramming {
  const partnerMode = programming.partnerMode ?? "you-go-i-go";
  return {
    ...programming,
    partnerMode,
    partnerSwitchSeconds: partnerMode === "alternating"
      ? programming.partnerSwitchSeconds ?? 30
      : undefined,
  };
}

function buildProgrammingWarnings(
  items: readonly TrainingDraft["session"]["phases"][number]["items"][number][],
  participantCount: number,
  partnerWorkout: boolean,
): readonly string[] {
  const warnings: string[] = [];
  if (partnerWorkout && participantCount % 2 !== 0) {
    warnings.push(`Partner Workout: ${participantCount} Teilnehmende ergeben keine vollständigen Paare. Plane eine rotierende dritte Person oder ein bewusstes Wechselteam ein.`);
  }
  const blockIndices = [...new Set(items.map((item) => item.mainPartIndex ?? 1))].sort((a, b) => a - b);
  for (const blockIndex of blockIndices) {
    const blockItems = items.filter((item) => (item.mainPartIndex ?? 1) === blockIndex);
    const programming = blockItems[0]?.programming;
    if (!programming) continue;
    const blockSeconds = blockItems.reduce((sum, item) => sum + item.durationMinutes * 60, 0);
    if (programming.partnerMode === "alternating") {
      const switchSeconds = programming.partnerSwitchSeconds ?? 30;
      if (switchSeconds >= blockSeconds) {
        warnings.push(`Hauptteil ${blockIndex}: Partner-Wechsel nach ${switchSeconds}s ist nicht kürzer als der gesamte Block (${blockSeconds}s).`);
      }
    }
    if (programming.mode !== "interval") continue;
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
