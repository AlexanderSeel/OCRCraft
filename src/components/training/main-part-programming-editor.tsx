"use client";

import {
  MAIN_PART_EVERY_UNITS,
  MAIN_PART_PROGRAMMING_MODES,
  type MainPartEveryUnit,
  type MainPartProgramming,
  type MainPartProgrammingMode,
  type MainPartScoreMode,
} from "@/domain/training/model";

interface MainPartProgrammingEditorProps {
  readonly index: number;
  readonly value: MainPartProgramming;
  readonly onChange: (value: MainPartProgramming) => void;
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

const everyUnitLabels: Readonly<Record<MainPartEveryUnit, string>> = {
  metres: "Meter",
  minutes: "Minuten",
  checkpoint: "Checkpoint",
};

export function MainPartProgrammingEditor({ index, value, onChange }: MainPartProgrammingEditorProps) {
  function switchMode(mode: MainPartProgrammingMode) {
    if (mode === "interval") return onChange({ mode, workSeconds: 40, restSeconds: 20 });
    if (mode === "rounds") return onChange({ mode, rounds: 3, scoreMode: "quality" });
    if (mode === "ladder") return onChange({ mode, ladderStart: 2, ladderEnd: 10, ladderStep: 2 });
    if (mode === "reverse-ladder") return onChange({ mode, ladderStart: 10, ladderEnd: 2, ladderStep: 2 });
    if (mode === "pyramid") return onChange({ mode, ladderStart: 2, ladderEnd: 10, ladderStep: 2 });
    if (mode === "every") return onChange({ mode, everyValue: 500, everyUnit: "metres" });
    onChange({ mode });
  }

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
      <div className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">Hauptteil {index + 1}</div>
      <label className="mt-2 grid gap-1.5 text-sm font-bold">
        Programmierung
        <select
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          onChange={(event) => switchMode(event.target.value as MainPartProgrammingMode)}
          value={value.mode}
        >
          {MAIN_PART_PROGRAMMING_MODES.map((mode) => <option key={mode} value={mode}>{modeLabels[mode]}</option>)}
        </select>
      </label>

      {value.mode === "interval" ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumberField label="Arbeit (Sek.)" min={5} max={3600} value={value.workSeconds ?? 40} onChange={(workSeconds) => onChange({ ...value, workSeconds })} />
          <NumberField label="Pause (Sek.)" min={0} max={1800} value={value.restSeconds ?? 20} onChange={(restSeconds) => onChange({ ...value, restSeconds })} />
        </div>
      ) : null}

      {value.mode === "rounds" ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumberField label="Runden" min={1} max={50} value={value.rounds ?? 3} onChange={(rounds) => onChange({ ...value, rounds })} />
          <label className="grid gap-1.5 text-xs font-bold">
            Ziel
            <select
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 font-normal"
              onChange={(event) => onChange({ ...value, scoreMode: event.target.value as MainPartScoreMode })}
              value={value.scoreMode ?? "quality"}
            >
              <option value="quality">Qualität</option>
              <option value="time">Zeit</option>
            </select>
          </label>
        </div>
      ) : null}

      {["ladder", "reverse-ladder", "pyramid"].includes(value.mode) ? (
        <div className="mt-3 grid grid-cols-3 gap-3">
          <NumberField label="Start" min={1} max={200} value={value.ladderStart ?? 2} onChange={(ladderStart) => onChange({ ...value, ladderStart })} />
          <NumberField label="Ziel" min={1} max={200} value={value.ladderEnd ?? 10} onChange={(ladderEnd) => onChange({ ...value, ladderEnd })} />
          <NumberField label="Schritt" min={1} max={50} value={value.ladderStep ?? 2} onChange={(ladderStep) => onChange({ ...value, ladderStep })} />
        </div>
      ) : null}

      {value.mode === "every" ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumberField label="Alle / jeder" min={1} max={10000} value={value.everyValue ?? 500} onChange={(everyValue) => onChange({ ...value, everyValue })} />
          <label className="grid gap-1.5 text-xs font-bold">
            Einheit
            <select
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 font-normal"
              onChange={(event) => onChange({ ...value, everyUnit: event.target.value as MainPartEveryUnit })}
              value={value.everyUnit ?? "metres"}
            >
              {MAIN_PART_EVERY_UNITS.map((unit) => <option key={unit} value={unit}>{everyUnitLabels[unit]}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      {value.mode === "chipper" ? (
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Alle Übungen des Blocks werden der Reihe nach vollständig abgearbeitet.</p>
      ) : null}
    </article>
  );
}

function NumberField({ label, min, max, value, onChange }: {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold">
      {label}
      <input
        className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 font-normal"
        max={max}
        min={min}
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
