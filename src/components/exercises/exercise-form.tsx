"use client";

import { useActionState } from "react";
import {
  exerciseCategories,
  exerciseCategoryLabels,
  exercisePhases,
  exerciseRiskLevels,
} from "@/domain/exercise/model";
import type { ExerciseEditorRecord } from "@/server/exercises/exercise-repository";
import type { ExerciseFormState } from "@/app/exercises/actions";

interface ExerciseFormProps {
  readonly action: (
    state: ExerciseFormState,
    formData: FormData,
  ) => Promise<ExerciseFormState>;
  readonly exercise?: ExerciseEditorRecord;
  readonly submitLabel: string;
}

const initialState: ExerciseFormState = {};

export function ExerciseForm({ action, exercise, submitLabel }: ExerciseFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div className="rounded-xl border border-[#e7c9a8] bg-[#fff7ed] p-4 text-sm font-semibold text-[#8a4b16]">
          {state.message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-black">Bezeichnung & Suche</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Deutsch ist Pflicht. Englisch fällt bei neuen Übungen automatisch auf Deutsch zurück.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Name (DE)" error={state.errors?.nameDe?.[0]}>
            <input className={inputClass} defaultValue={exercise?.nameDe} name="nameDe" required />
          </Field>
          <Field label="Name (EN)" error={state.errors?.nameEn?.[0]}>
            <input className={inputClass} defaultValue={exercise?.nameEn} name="nameEn" />
          </Field>
          <Field label="Aliase (DE)" hint="Kommagetrennt, z. B. Pendellauf, Shuttle" error={state.errors?.aliasesDe?.[0]}>
            <input className={inputClass} defaultValue={exercise?.aliasesDe.join(", ")} name="aliasesDe" />
          </Field>
          <Field label="Aliase (EN)" hint="Comma separated" error={state.errors?.aliasesEn?.[0]}>
            <input className={inputClass} defaultValue={exercise?.aliasesEn.join(", ")} name="aliasesEn" />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-black">Trainingsklassifikation</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Bereich" error={state.errors?.category?.[0]}>
            <select className={inputClass} defaultValue={exercise?.category ?? "general"} name="category">
              {exerciseCategories.map((category) => (
                <option key={category} value={category}>{exerciseCategoryLabels[category]}</option>
              ))}
            </select>
          </Field>
          <Field label="Standardphase" error={state.errors?.phase?.[0]}>
            <select className={inputClass} defaultValue={exercise?.phase ?? "main"} name="phase">
              {exercisePhases.map((phase) => (
                <option key={phase} value={phase}>{phase === "warmup" ? "Aufwärmen" : phase === "main" ? "Hauptteil" : "Cooldown"}</option>
              ))}
            </select>
          </Field>
          <Field label="Risiko" error={state.errors?.riskLevel?.[0]}>
            <select className={inputClass} defaultValue={exercise?.riskLevel ?? "low"} name="riskLevel">
              {exerciseRiskLevels.map((risk) => <option key={risk} value={risk}>{risk}</option>)}
            </select>
          </Field>
          <Field label="Mindestalter" error={state.errors?.minAge?.[0]}>
            <input className={inputClass} defaultValue={exercise?.minAge ?? ""} max={99} min={4} name="minAge" type="number" />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-black">Kurzbeschreibung</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Beschreibung (DE)" error={state.errors?.summaryDe?.[0]}>
            <textarea className={`${inputClass} min-h-32 py-3`} defaultValue={exercise?.summaryDe} maxLength={800} name="summaryDe" />
          </Field>
          <Field label="Beschreibung (EN)" error={state.errors?.summaryEn?.[0]}>
            <textarea className={`${inputClass} min-h-32 py-3`} defaultValue={exercise?.summaryEn} maxLength={800} name="summaryEn" />
          </Field>
        </div>
      </section>

      <div className="flex justify-end">
        <button className="min-h-11 rounded-xl bg-[var(--accent)] px-6 text-sm font-black text-[var(--dark)] disabled:opacity-50" disabled={pending} type="submit">
          {pending ? "Speichert …" : submitLabel}
        </button>
      </div>
    </form>
  );
}

const inputClass = "min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[#4d75ff] focus:ring-2 focus:ring-[#4d75ff]/15";

function Field({
  label,
  hint,
  error,
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold">
      {label}
      {children}
      {error ? <span className="text-xs font-semibold text-[#b42318]">{error}</span> : null}
      {!error && hint ? <span className="text-xs font-normal text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}
