import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { createExerciseAction } from "@/app/exercises/actions";

export default function NewGamePage() {
  return (
    <AppShell
      title="Neues Spiel"
      subtitle="Ein Spiel ist ein vollwertiger OCRCraft-Katalogeintrag vom Typ game und nutzt danach denselben vollständigen Editor wie jede Übung."
      actions={<Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold" href="/games">Abbrechen</Link>}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--muted)]">
          <span className="font-black text-[var(--foreground)]">Schritt 1 von 2:</span> Grunddaten anlegen. Anschließend können Zielgruppen, Trainingsziele, Muskeln, Equipment, Medien, Spielablauf, Coaching, Sicherheit und Level im normalen Übungseditor gepflegt werden.
        </div>
        <ExerciseForm action={createExerciseAction} initialExerciseType="game" submitLabel="Spiel anlegen & vollständigen Editor öffnen" />
      </div>
    </AppShell>
  );
}
