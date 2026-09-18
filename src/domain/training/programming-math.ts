import type { MainPartProgramming } from "./model";

export interface ProgrammingArithmetic {
  readonly summary: string | null;
  readonly warnings: readonly string[];
  readonly sequence?: readonly number[];
  readonly totalRepetitionsPerExercise?: number;
}

function ladderSequence(start: number, end: number, step: number): number[] {
  const values: number[] = [];
  if (start <= end) {
    for (let value = start; value <= end; value += step) values.push(value);
  } else {
    for (let value = start; value >= end; value -= step) values.push(value);
  }
  return values;
}

export function analyzeMainPartProgramming(
  programming: MainPartProgramming,
  blockSeconds: number,
  exerciseCount: number,
): ProgrammingArithmetic {
  const safeBlockSeconds = Math.max(0, Math.floor(blockSeconds));
  const safeExerciseCount = Math.max(1, Math.floor(exerciseCount));
  const warnings: string[] = [];

  if (programming.mode === "interval") {
    const work = programming.workSeconds ?? 0;
    const rest = programming.restSeconds ?? 0;
    const cycle = work + rest;
    if (cycle <= 0) return { summary: null, warnings };
    const cycles = Math.floor(safeBlockSeconds / cycle);
    const remainder = safeBlockSeconds % cycle;
    if (cycles < 1) warnings.push("Das gewählte Intervall ist länger als der gesamte Block.");
    else if (remainder >= 15) warnings.push(`${remainder}s bleiben für Übergang/Erklärung.`);
    return {
      summary: `${cycles} vollständige Zyklen · ${cycles * work}s Arbeit · ${cycles * rest}s Pause${remainder ? ` · ${remainder}s Rest` : ""}`,
      warnings,
    };
  }

  if (programming.mode === "rounds") {
    const rounds = Math.max(1, programming.rounds ?? 1);
    const roundRest = Math.max(0, programming.roundRestSeconds ?? 0);
    const totalRest = Math.max(0, rounds - 1) * roundRest;
    const active = safeBlockSeconds - totalRest;
    if (active <= 0) warnings.push("Die geplanten Rundenpausen verbrauchen den gesamten Block.");
    const secondsPerRound = active > 0 ? Math.floor(active / rounds) : 0;
    if (secondsPerRound > 0 && secondsPerRound < safeExerciseCount * 15) {
      warnings.push("Pro Runde bleibt sehr wenig aktive Zeit je Übung; reduziere Runden, Übungen oder Pausen.");
    }
    return {
      summary: `${rounds} Runden · ca. ${secondsPerRound}s aktive Zeit/Runde${roundRest ? ` · ${roundRest}s Rundenpause` : ""}`,
      warnings,
    };
  }

  if (programming.mode === "ladder" || programming.mode === "reverse-ladder" || programming.mode === "pyramid") {
    const start = programming.ladderStart ?? 1;
    const end = programming.ladderEnd ?? start;
    const step = Math.max(1, programming.ladderStep ?? 1);
    const distance = Math.abs(end - start);
    if (programming.mode === "pyramid" && end <= start) {
      warnings.push("Der Pyramiden-Gipfel sollte über dem Startwert liegen.");
    }
    if (distance > 0 && distance % step !== 0) {
      warnings.push("Die Schrittweite erreicht den Zielwert nicht exakt.");
    }
    const ascending = ladderSequence(start, end, step);
    const sequence = programming.mode === "pyramid"
      ? [...ascending, ...ascending.slice(0, -1).reverse()]
      : ascending;
    const total = sequence.reduce((sum, value) => sum + value, 0);
    return {
      summary: `${sequence.length} Stufen · ${total} Wdh./Übung · ${total * safeExerciseCount} Wdh. im Block`,
      warnings,
      sequence,
      totalRepetitionsPerExercise: total,
    };
  }

  if (programming.mode === "chipper") {
    const reps = Math.max(1, programming.chipperRepsPerExercise ?? 20);
    return {
      summary: `${reps} Wdh./Übung · ${reps * safeExerciseCount} Zielwiederholungen im Chipper`,
      warnings,
      totalRepetitionsPerExercise: reps,
    };
  }

  if (programming.mode === "every") {
    const everyValue = Math.max(1, programming.everyValue ?? 1);
    const work = Math.max(0, programming.everyWorkSeconds ?? 40);
    const rest = Math.max(0, programming.everyRestSeconds ?? 20);
    if (programming.everyUnit === "minutes") {
      const triggerSeconds = everyValue * 60;
      const triggers = Math.floor(safeBlockSeconds / triggerSeconds);
      if (work + rest >= triggerSeconds) warnings.push("Arbeit plus Pause lässt bis zum nächsten Minuten-Trigger keine Lauf-/Übergangszeit.");
      return {
        summary: `${triggers} Trigger im Block · je ${work}s Arbeit + ${rest}s Reset · ${triggers * (work + rest)}s Triggerzeit gesamt`,
        warnings,
      };
    }
    const unit = programming.everyUnit === "checkpoint" ? "Checkpoint" : "m";
    return {
      summary: `Alle ${everyValue} ${unit}: ${work}s Arbeit + ${rest}s Reset · Triggeranzahl streckenabhängig`,
      warnings,
    };
  }

  return { summary: null, warnings };
}
