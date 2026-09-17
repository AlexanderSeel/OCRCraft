"use client";

import { useState } from "react";
import { addTrainingItemAction } from "@/app/training/[id]/actions";
import { Disclosure } from "@/components/ui/disclosure";
import {
  ExerciseAutocompletePicker,
  type SelectedExerciseReference,
} from "./exercise-autocomplete-picker";

interface AddTrainingItemFormProps {
  readonly sessionId: string;
  readonly phaseId: string;
}

export function AddTrainingItemForm({ sessionId, phaseId }: AddTrainingItemFormProps) {
  const [selected, setSelected] = useState<readonly SelectedExerciseReference[]>([]);

  return (
    <Disclosure className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]" summaryClassName="px-4 py-3 text-sm font-black" summary="+ Übung hinzufügen">
      <form action={addTrainingItemAction} className="grid gap-4 border-t border-[var(--border)] p-4">
        <input name="sessionId" type="hidden" value={sessionId} />
        <input name="phaseId" type="hidden" value={phaseId} />
        <input name="exerciseId" type="hidden" value={selected[0]?.id ?? ""} />

        <ExerciseAutocompletePicker
          description="Durchsucht Namen, Aliase, Kategorien, Tags, Equipment, Bewegungsmuster und Körperregionen."
          label="Übung / Hindernis"
          maxItems={1}
          onChange={setSelected}
          selected={selected}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-bold">
            Dauer
            <div className="flex items-center gap-2">
              <input
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                defaultValue={5}
                min={1}
                name="durationMinutes"
                required
                type="number"
              />
              <span className="text-sm text-[var(--muted)]">Min.</span>
            </div>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Format
            <select
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
              defaultValue=""
              name="format"
            >
              <option value="">Kein spezielles Format</option>
              <option value="free">Frei</option>
              <option value="circuit">Zirkel</option>
              <option value="tabata">Tabata</option>
              <option value="amrap">AMRAP</option>
              <option value="emom">EMOM</option>
              <option value="rig-run">Rig & Run</option>
              <option value="run-exercise">Run + Exercise</option>
              <option value="technique">Technik</option>
              <option value="relay">Team / Relay</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Level / Variante
            <input
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
              maxLength={120}
              name="levelLabel"
              placeholder="z. B. Level 2"
            />
          </label>
        </div>

        <Disclosure className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3" summaryClassName="text-sm font-black" summary="Hauptteil-Zuordnung">
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Wird nur ausgewertet, wenn diese Übung in der Hauptphase hinzugefügt wird. Leer lassen übernimmt den letzten vorhandenen Hauptteil bzw. Hauptteil 1.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Hauptteil Nr.
              <input
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                max={12}
                min={1}
                name="mainPartIndex"
                placeholder="z. B. 2"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Bezeichnung
              <input
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                maxLength={120}
                name="mainPartTitle"
                placeholder="z. B. Hauptteil 2 · Griff & Rig"
              />
            </label>
          </div>
        </Disclosure>

        <label className="grid gap-2 text-sm font-bold">
          Trainingshinweis
          <textarea
            className="min-h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-normal leading-6 outline-none focus:border-[var(--focus)]"
            maxLength={4000}
            name="instructions"
            placeholder="Optionaler Hinweis speziell für diese Einheit …"
          />
        </label>

        <div className="flex justify-end">
          <button
            className="min-h-11 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={selected.length !== 1}
            type="submit"
          >
            Zur Phase hinzufügen
          </button>
        </div>
      </form>
    </Disclosure>
  );
}
