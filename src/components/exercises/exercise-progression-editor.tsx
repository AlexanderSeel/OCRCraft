import type { ExerciseProgressionRelation, ExerciseRelationOption } from "@/server/exercises/exercise-repository";

export function ExerciseProgressionEditor({
  relations,
  options,
  addAction,
  deleteAction,
  disabled,
}: {
  readonly relations: readonly ExerciseProgressionRelation[];
  readonly options: readonly ExerciseRelationOption[];
  readonly addAction: (formData: FormData) => void | Promise<void>;
  readonly deleteAction: (formData: FormData) => void | Promise<void>;
  readonly disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      {relations.length ? <div className="grid gap-2 sm:grid-cols-2">
        {relations.map((relation) => (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3" key={relation.id}>
            <div><div className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">{label(relation.type)}</div><div className="font-bold">{relation.exerciseName}</div>{relation.notesDe ? <p className="mt-1 text-sm text-[var(--muted)]">{relation.notesDe}</p> : null}</div>
            <form action={deleteAction}><input name="relationId" type="hidden" value={relation.id} /><button className="text-xs font-black text-[var(--danger)]" disabled={disabled} type="submit">Entfernen</button></form>
          </div>
        ))}
      </div> : <p className="text-sm text-[var(--muted)]">Noch keine verknüpften Varianten.</p>}
      <form action={addAction} className="grid gap-3 rounded-xl border border-dashed border-[var(--border)] p-3 sm:grid-cols-2">
        <label className="text-sm font-bold">Beziehung<select className="mt-1 min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3" defaultValue="regression" disabled={disabled} name="type"><option value="regression">Regression / leichter</option><option value="progression">Progression / anspruchsvoller</option><option value="alternative">Alternative</option></select></label>
        <label className="text-sm font-bold">Übung<select className="mt-1 min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3" defaultValue="" disabled={disabled} name="relatedExerciseId" required><option value="">Übung auswählen …</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
        <label className="text-sm font-bold sm:col-span-2">Hinweis (DE)<input className="mt-1 min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3" disabled={disabled} maxLength={500} name="notesDe" /></label>
        <label className="text-sm font-bold sm:col-span-2">Hinweis (EN)<input className="mt-1 min-h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3" disabled={disabled} maxLength={500} name="notesEn" /></label>
        <button className="min-h-10 rounded-lg bg-[var(--control-strong)] px-3 text-sm font-black text-[var(--control-strong-foreground)] sm:col-span-2 sm:w-fit" disabled={disabled || options.length === 0} type="submit">Beziehung speichern</button>
      </form>
    </div>
  );
}

function label(type: ExerciseProgressionRelation["type"]): string { return type === "regression" ? "Regression / leichter" : type === "progression" ? "Progression / anspruchsvoller" : "Alternative"; }
