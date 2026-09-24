import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { createExerciseAction } from "../actions";

export default function NewExercisePage() {
  return (
    <AppShell
      title="Neue Übung"
      subtitle="Lege zuerst Identität und Grundklassifikation an. Danach öffnet OCRCraft automatisch den vollständigen Editor für Muskeln/Gegenmuskeln, Equipment, Programmierung, Sicherheit und DE/EN-Coaching."
      actions={<Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold" href="/exercises">Abbrechen</Link>}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--muted)]">
          <span className="font-black text-[var(--foreground)]">Schritt 1 von 2:</span> Grunddaten speichern. Anschließend wird dieselbe vollständige Bearbeitungsoberfläche geöffnet, die auch für bestehende Übungen verwendet wird.
        </div>
        <div data-tour="exercise-identity"><ExerciseForm action={createExerciseAction} submitLabel="Anlegen & vollständigen Editor öffnen" /></div>
      </div>
    </AppShell>
  );
}
