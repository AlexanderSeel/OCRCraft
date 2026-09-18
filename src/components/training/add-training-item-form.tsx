"use client";

import { useState } from "react";
import { addTrainingItemAction } from "@/app/training/[id]/actions";
import { Disclosure } from "@/components/ui/disclosure";
import {
  FormActions,
  FormField,
  PrimaryFormButton,
  formControlClass,
} from "@/components/ui/form";
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
          <FormField label="Dauer" required>
            <div className="flex items-center gap-2">
              <input className={formControlClass} defaultValue={5} min={1} name="durationMinutes" required type="number" />
              <span className="text-sm font-normal text-[var(--muted)]">Min.</span>
            </div>
          </FormField>
          <FormField label="Format">
            <select className={formControlClass} defaultValue="" name="format">
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
              <option value="partner">Partner Workout</option>
            </select>
          </FormField>
          <FormField hint="Optional, z. B. Level 2" label="Level / Variante">
            <input className={formControlClass} maxLength={120} name="levelLabel" placeholder="z. B. Level 2" />
          </FormField>
        </div>

        <Disclosure className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3" summaryClassName="text-sm font-black" summary="Hauptteil-Zuordnung">
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Wird nur ausgewertet, wenn diese Übung in der Hauptphase hinzugefügt wird. Leer lassen übernimmt den letzten vorhandenen Hauptteil bzw. Hauptteil 1.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FormField label="Hauptteil Nr.">
              <input className={formControlClass} max={12} min={1} name="mainPartIndex" placeholder="z. B. 2" type="number" />
            </FormField>
            <FormField label="Bezeichnung">
              <input className={formControlClass} maxLength={120} name="mainPartTitle" placeholder="z. B. Hauptteil 2 · Griff & Rig" />
            </FormField>
          </div>
        </Disclosure>

        <FormField hint="Optionaler Hinweis nur für diese konkrete Einheit." label="Trainingshinweis">
          <textarea className={`${formControlClass} min-h-24 py-3 leading-6`} maxLength={4000} name="instructions" placeholder="Optionaler Hinweis speziell für diese Einheit …" />
        </FormField>

        <FormActions>
          <PrimaryFormButton disabled={selected.length !== 1}>Zur Phase hinzufügen</PrimaryFormButton>
        </FormActions>
      </form>
    </Disclosure>
  );
}
