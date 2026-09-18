"use client";

import { useActionState } from "react";
import type { ExerciseFormState } from "@/app/exercises/actions";
import {
  FormActions,
  FormField,
  FormMessage,
  PrimaryFormButton,
  formControlClass,
} from "@/components/ui/form";
import type { ExerciseType } from "@/domain/exercise/classification";
import {
  exerciseCategories,
  exerciseCategoryLabels,
  exercisePhases,
  exerciseRiskLevels,
} from "@/domain/exercise/model";
import type { ExerciseEditorRecord } from "@/server/exercises/exercise-repository";

interface ExerciseFormProps {
  readonly action: (
    state: ExerciseFormState,
    formData: FormData,
  ) => Promise<ExerciseFormState>;
  readonly exercise?: ExerciseEditorRecord;
  readonly initialExerciseType?: ExerciseType;
  readonly submitLabel: string;
}

const initialState: ExerciseFormState = {};

export function ExerciseForm({ action, exercise, initialExerciseType, submitLabel }: ExerciseFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {initialExerciseType ? <input name="initialExerciseType" type="hidden" value={initialExerciseType} /> : null}
      {state.message ? <FormMessage tone="warning">{state.message}</FormMessage> : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-lg font-black">Bezeichnung & Suche</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          Deutsch ist Pflicht. Englisch fällt bei neuen Übungen automatisch auf Deutsch zurück.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <FormField error={state.errors?.nameDe?.[0]} label="Name (DE)" required>
            <input aria-invalid={Boolean(state.errors?.nameDe?.[0])} className={formControlClass} defaultValue={exercise?.nameDe} name="nameDe" required />
          </FormField>
          <FormField error={state.errors?.nameEn?.[0]} label="Name (EN)">
            <input aria-invalid={Boolean(state.errors?.nameEn?.[0])} className={formControlClass} defaultValue={exercise?.nameEn} name="nameEn" />
          </FormField>
          <FormField error={state.errors?.aliasesDe?.[0]} hint="Kommagetrennt, z. B. Pendellauf, Shuttle" label="Aliase (DE)">
            <input aria-invalid={Boolean(state.errors?.aliasesDe?.[0])} className={formControlClass} defaultValue={exercise?.aliasesDe.join(", ")} name="aliasesDe" />
          </FormField>
          <FormField error={state.errors?.aliasesEn?.[0]} hint="Comma separated" label="Aliase (EN)">
            <input aria-invalid={Boolean(state.errors?.aliasesEn?.[0])} className={formControlClass} defaultValue={exercise?.aliasesEn.join(", ")} name="aliasesEn" />
          </FormField>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-lg font-black">Trainingsklassifikation</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FormField error={state.errors?.category?.[0]} label="Bereich">
            <select aria-invalid={Boolean(state.errors?.category?.[0])} className={formControlClass} defaultValue={exercise?.category ?? "general"} name="category">
              {exerciseCategories.map((category) => (
                <option key={category} value={category}>{exerciseCategoryLabels[category]}</option>
              ))}
            </select>
          </FormField>
          <FormField error={state.errors?.phase?.[0]} label="Standardphase">
            <select aria-invalid={Boolean(state.errors?.phase?.[0])} className={formControlClass} defaultValue={exercise?.phase ?? "main"} name="phase">
              {exercisePhases.map((phase) => (
                <option key={phase} value={phase}>{phase === "warmup" ? "Aufwärmen" : phase === "main" ? "Hauptteil" : "Cooldown"}</option>
              ))}
            </select>
          </FormField>
          <FormField error={state.errors?.riskLevel?.[0]} label="Risiko">
            <select aria-invalid={Boolean(state.errors?.riskLevel?.[0])} className={formControlClass} defaultValue={exercise?.riskLevel ?? "low"} name="riskLevel">
              {exerciseRiskLevels.map((risk) => <option key={risk} value={risk}>{risk}</option>)}
            </select>
          </FormField>
          <FormField error={state.errors?.minAge?.[0]} label="Mindestalter">
            <input aria-invalid={Boolean(state.errors?.minAge?.[0])} className={formControlClass} defaultValue={exercise?.minAge ?? ""} max={99} min={4} name="minAge" type="number" />
          </FormField>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-lg font-black">Kurzbeschreibung</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <FormField error={state.errors?.summaryDe?.[0]} label="Beschreibung (DE)">
            <textarea aria-invalid={Boolean(state.errors?.summaryDe?.[0])} className={`${formControlClass} min-h-32 py-3 leading-6`} defaultValue={exercise?.summaryDe} maxLength={800} name="summaryDe" />
          </FormField>
          <FormField error={state.errors?.summaryEn?.[0]} label="Beschreibung (EN)">
            <textarea aria-invalid={Boolean(state.errors?.summaryEn?.[0])} className={`${formControlClass} min-h-32 py-3 leading-6`} defaultValue={exercise?.summaryEn} maxLength={800} name="summaryEn" />
          </FormField>
        </div>
      </section>

      <FormActions>
        <PrimaryFormButton disabled={pending}>
          {pending ? "Speichert …" : submitLabel}
        </PrimaryFormButton>
      </FormActions>
    </form>
  );
}
