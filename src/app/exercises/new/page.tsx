import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { createExerciseAction } from "../actions";

export default function NewExercisePage() {
  return (
    <AppShell
      title="Neue Übung"
      subtitle="Neue Übungen stehen direkt für Suche, Training und später den AI Composer zur Verfügung."
      actions={<Link className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-bold" href="/exercises">Abbrechen</Link>}
    >
      <ExerciseForm action={createExerciseAction} submitLabel="Übung anlegen" />
    </AppShell>
  );
}
