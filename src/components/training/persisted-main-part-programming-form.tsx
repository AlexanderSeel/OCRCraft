"use client";

import { useState } from "react";
import {
  MAIN_PART_EVERY_UNITS,
  MAIN_PART_PROGRAMMING_MODES,
  PARTNER_WORK_MODES,
  type MainPartEveryUnit,
  type MainPartProgramming,
  type MainPartProgrammingMode,
  type MainPartScoreMode,
  type PartnerWorkMode,
} from "@/domain/training/model";
import { updateTrainingMainPartProgrammingAction } from "@/app/training/[id]/programming-action";
import { Disclosure } from "@/components/ui/disclosure";

interface PersistedMainPartProgrammingFormProps {
  readonly sessionId: string;
  readonly mainPartIndex: number;
  readonly title: string;
  readonly initialProgramming?: MainPartProgramming | null;
}

const partnerModeLabels: Readonly<Record<PartnerWorkMode, string>> = {
  "you-go-i-go": "You-go-I-go",
  synchronized: "Synchron",
  alternating: "Alternierend",
  "shared-target": "Gemeinsames Ziel",
};

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
    const partner = {
      partnerMode: programming.partnerMode,
      partnerSwitchSeconds: programming.partnerMode === "alternating"
        ? programming.partnerSwitchSeconds ?? 30
        : undefined,
    };
    if (mode === "interval") return setProgramming({ mode, workSeconds: 40, restSeconds: 20, ...partner });
    if (mode === "rounds") return setProgramming({ mode, rounds: 3, scoreMode: "quality", roundRestSeconds: 0, ...partner });
    if (mode === "ladder") return setProgramming({ mode, ladderStart: 2, ladderEnd: 10, ladderStep: 2, ...partner });
    if (mode === "reverse-ladder") return setProgramming({ mode, ladderStart: 10, ladderEnd: 2, ladderStep: 2, ...partner });
    if (mode === "pyramid") return setProgramming({ mode, ladderStart: 2, ladderEnd: 10, ladderStep: 2, ...partner });
    if (mode === "chipper") return setProgramming({ mode, chipperRepsPerExercise: 20, ...partner });
    if (mode === "every") return setProgramming({ mode, everyValue: 500, everyUnit: "metres", everyWorkSeconds: 40, everyRestSeconds: 20, ...partner });
    setProgramming({ mode, ...partner });
  }

  return (
    <Disclosure
      className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
      summaryClassName="px-4 py-3 text-sm font-black"
      summary={`${title} programmieren${programming.mode !== "standard" || programming.partnerMode ? ` · ${shortLabel(programming)}` : ""}`}
    >
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
            <div className="sm:col-span-2">
              <NumberInput label="Pause zwischen Runden (Sek.)" max={600} min={0} name="roundRestSeconds" onChange={(roundRestSeconds) => setProgramming({ ...programming, roundRestSeconds })} value={programming.roundRestSeconds ?? 0} />
            </div>
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
            <NumberInput label="Arbeit am Trigger (Sek.)" max={1800} min={5} name="everyWorkSeconds" onChange={(everyWorkSeconds) => setProgramming({ ...programming, everyWorkSeconds })} value={programming.everyWorkSeconds ?? 40} />
            <NumberInput label="Reset/Pause (Sek.)" max={1800} min={0} name="everyRestSeconds" onChange={(everyRestSeconds) => setProgramming({ ...programming, everyRestSeconds })} value={programming.everyRestSeconds ?? 20} />
          </div>
        ) : null}

        {programming.mode === "chipper" ? (
          <div className="grid gap-2">
            <div className="max-w-48">
              <NumberInput label="Wdh. pro Übung" max={500} min={1} name="chipperRepsPerExercise" onChange={(chipperRepsPerExercise) => setProgramming({ ...programming, chipperRepsPerExercise })} value={programming.chipperRepsPerExercise ?? 20} />
            </div>
            <p className="text-xs leading-5 text-[var(--muted)]">Die Übungen dieses Hauptteils werden mit der Zielmenge nacheinander vollständig abgearbeitet.</p>
          </div>
        ) : null}

        {programming.partnerMode ? (
          <div className="grid gap-3 border-t border-[var(--border)] pt-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold">
              Partner-Arbeitsweise
              <select
                className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                name="partnerMode"
                onChange={(event) => {
                  const partnerMode = event.target.value as PartnerWorkMode;
                  setProgramming({
                    ...programming,
                    partnerMode,
                    partnerSwitchSeconds: partnerMode === "alternating" ? programming.partnerSwitchSeconds ?? 30 : undefined,
                  });
                }}
                value={programming.partnerMode}
              >
                {PARTNER_WORK_MODES.map((mode) => <option key={mode} value={mode}>{partnerModeLabels[mode]}</option>)}
              </select>
            </label>
            {programming.partnerMode === "alternating" ? (
              <NumberInput
                label="Wechsel alle (Sek.)"
                max={1800}
                min={5}
                name="partnerSwitchSeconds"
                onChange={(partnerSwitchSeconds) => setProgramming({ ...programming, partnerSwitchSeconds })}
                value={programming.partnerSwitchSeconds ?? 30}
              />
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button className="min-h-10 rounded-lg bg-[var(--control-strong)] px-4 text-xs font-black text-[var(--control-strong-foreground)]" type="submit">
            Hauptteil-Programmierung speichern
          </button>
        </div>
      </form>
    </Disclosure>
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
  let base = "Standard";
  if (programming.mode === "interval") base = `${programming.workSeconds ?? 0}/${programming.restSeconds ?? 0}s`;
  else if (programming.mode === "rounds") base = `${programming.rounds ?? 1} Runden`;
  else if (programming.mode === "ladder") base = `Ladder ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1}`;
  else if (programming.mode === "reverse-ladder") base = `Reverse ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1}`;
  else if (programming.mode === "pyramid") base = `Pyramide bis ${programming.ladderEnd ?? 1}`;
  else if (programming.mode === "chipper") base = `Chipper ${programming.chipperRepsPerExercise ?? 20} Wdh.`;
  else if (programming.mode === "every") {
    const trigger = programming.everyUnit === "checkpoint"
      ? `jeder ${programming.everyValue ?? 1}. Checkpoint`
      : `alle ${programming.everyValue ?? 1} ${programming.everyUnit === "minutes" ? "Min." : "m"}`;
    base = `${trigger} · ${programming.everyWorkSeconds ?? 40}/${programming.everyRestSeconds ?? 20}s`;
  }

  if (!programming.partnerMode) return base;
  const partner = programming.partnerMode === "synchronized"
    ? "synchron"
    : programming.partnerMode === "alternating"
      ? `Wechsel ${programming.partnerSwitchSeconds ?? 30}s`
      : programming.partnerMode === "shared-target"
        ? "gemeinsames Ziel"
        : "You-go-I-go";
  return `${base} · ${partner}`;
}
