"use client";

import { useState } from "react";
import {
  MAIN_PART_EVERY_UNITS,
  MAIN_PART_PROGRAMMING_MODES,
  type MainPartEveryUnit,
  type MainPartProgramming,
  type MainPartProgrammingMode,
  type MainPartScoreMode,
} from "@/domain/training/model";
import { updateTrainingMainPartProgrammingAction } from "@/app/training/[id]/programming-action";

interface PersistedMainPartProgrammingFormProps {
  readonly sessionId: string;
  readonly mainPartIndex: number;
  readonly title: string;
  readonly initialProgramming?: MainPartProgramming | null;
}

const modeLabels: Readonly<Record<MainPartProgrammingMode, string>> = {
  standard: "Standard / frei",
  interval: "Intervall Arbeit / Pause",
  rounds: "Feste Runden",
  ladder: "Ladder",
  "reverse-ladder": "Reverse Ladder",
  pyramid: "Pyramide",
  chipper: "Chipper",
  every: "Every X / Checkpoint",
};

export function PersistedMainPartProgrammingForm({
  sessionId,
  mainPartIndex,
  title,
  initialProgramming,
}: PersistedMainPartProgrammingFormProps) {
  const [programming, setProgramming] = useState<MainPartProgramming>(initialProgramming ?? { mode: "standard" });

  function setMode(mode: MainPartProgrammingMode) {
    if (mode === "interval") return setProgramming({ mode, workSeconds: 40, restSeconds: 20 });
    if (mode === "rounds") return setProgramming({ mode, rounds: 3, scoreMode: "quality" });
    if (mode === "ladder") return setProgramming({ mode, ladderStart: 2, ladderEnd: 10, ladderStep: 2 });
    if (mode === "reverse-ladder") return setProgramming({ mode, ladderStart: 10, ladderEnd: 2, ladderStep: 2 });
    if (mode === "pyramid") return setProgramming({ mode, ladderStart: 2, ladderEnd: 10, ladderStep: 2 });
    if (mode === "every") return setProgramming({ mode, everyValue: 500, everyUnit: "metres" });
    setProgramming({ mode });
  }

  return (
    <details className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]">
      <summary className="cursor-pointer px-4 py-3 text-sm font-black">
        {title} programmieren{programming.mode !== "standard" ? ` · ${shortLabel(programming)}` : ""}
      </summary>
      <form action={updateTrainingMainPartProgrammingAction} className="grid gap-3 border-t border-[var(--border)] p-4">
        <input name="sessionId" type="hidden" value={sessionId} />
        <input name="mainPartIndex" type="hidden" value={mainPartIndex} />
        <label className="grid gap-1.5 text-xs font-bold">
          Programmierung
          <select
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
            name="mode"
            onChange={(event) => setMode(event.target.value as MainPartProgrammingMode)}
            value={programming.mode}
          >
            {MAIN_PART_PROGRAMMING_MODES.map((mode) => <option key={mode} value={mode}>{modeLabels[mode]}</option>)}
          </select>
        </label>

        {programming.mode === "interval" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberInput label="Arbeit (Sek.)" max={3600} min={5} name="workSeconds" onChange={(workSeconds) => setProgramming({ ...programming, workSeconds })} value={programming.workSeconds ?? 40} />
            <NumberInput label="Pause (Sek.)" max={1800} min={0} name="restSeconds" onChange={(restSeconds) => setProgramming({ ...programming, restSeconds })} value={programming.restSeconds ?? 20} />
          </div>
        ) : null}

        {programming.mode === "rounds" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberInput label="Runden" max={50} min={1} name="rounds" onChange={(rounds) => setProgramming({ ...programming, rounds })} value={programming.rounds ?? 3} />
            <label className="grid gap-1.5 text-xs font-bold">
              Ziel
              <select
                className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                name="scoreMode"
                onChange={(event) => setProgramming({ ...programming, scoreMode: event.target.value as MainPartScoreMode })}
                value={programming.scoreMode ?? "quality"}
              >
                <option value="quality">Qualität</option>
                <option value="time">Zeit</option>
              </select>
            </label>
          </div>
        ) : null}

        {["ladder", "reverse-ladder", "pyramid"].includes(programming.mode) ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberInput label="Start" max={200} min={1} name="ladderStart" onChange={(ladderStart) => setProgramming({ ...programming, ladderStart })} value={programming.ladderStart ?? 2} />
            <NumberInput label="Ziel" max={200} min={1} name="ladderEnd" onChange={(ladderEnd) => setProgramming({ ...programming, ladderEnd })} value={programming.ladderEnd ?? 10} />
            <NumberInput label="Schritt" max={50} min={1} name="ladderStep" onChange={(ladderStep) => setProgramming({ ...programming, ladderStep })} value={programming.ladderStep ?? 2} />
          </div>
        ) : null}

        {programming.mode === "every" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberInput label="Alle / jeder" max={10000} min={1} name="everyValue" onChange={(everyValue) => setProgramming({ ...programming, everyValue })} value={programming.everyValue ?? 500} />
            <label className="grid gap-1.5 text-xs font-bold">
              Einheit
              <select
                className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                name="everyUnit"
                onChange={(event) => setProgramming({ ...programming, everyUnit: event.target.value as MainPartEveryUnit })}
                value={programming.everyUnit ?? "metres"}
              >
                {MAIN_PART_EVERY_UNITS.map((unit) => (
                  <option key={unit} value={unit}>{unit === "metres" ? "Meter" : unit === "minutes" ? "Minuten" : "Checkpoint"}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {programming.mode === "chipper" ? (
          <p className="text-xs leading-5 text-[var(--muted)]">Die Übungen dieses Hauptteils werden nacheinander vollständig abgearbeitet.</p>
        ) : null}

        <div className="flex justify-end">
          <button className="min-h-10 rounded-lg bg-[var(--control-strong)] px-4 text-xs font-black text-[var(--control-strong-foreground)]" type="submit">
            Hauptteil-Programmierung speichern
          </button>
        </div>
      </form>
    </details>
  );
}

function NumberInput({ label, name, min, max, value, onChange }: {
  readonly label: string;
  readonly name: string;
  readonly min: number;
  readonly max: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold">
      {label}
      <input
        className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
        max={max}
        min={min}
        name={name}
        onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
        type="number"
        value={value}
      />
    </label>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function shortLabel(programming: MainPartProgramming): string {
  if (programming.mode === "interval") return `${programming.workSeconds ?? 0}/${programming.restSeconds ?? 0}s`;
  if (programming.mode === "rounds") return `${programming.rounds ?? 1} Runden`;
  if (programming.mode === "ladder") return `Ladder ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1}`;
  if (programming.mode === "reverse-ladder") return `Reverse ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1}`;
  if (programming.mode === "pyramid") return `Pyramide bis ${programming.ladderEnd ?? 1}`;
  if (programming.mode === "chipper") return "Chipper";
  if (programming.mode === "every") return programming.everyUnit === "checkpoint"
    ? `jeder ${programming.everyValue ?? 1}. Checkpoint`
    : `alle ${programming.everyValue ?? 1} ${programming.everyUnit === "minutes" ? "Min." : "m"}`;
  return "Standard";
}
