import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  TrainingBuilderPanel,
  type TrainingBuilderInitialState,
  type TrainingBuilderSourceOption,
} from "@/components/training/training-builder-panel";
import { TrainingQuickPlanner } from "@/components/training/training-quick-planner";
import { listTrainingEquipmentOptions } from "@/server/training/training-draft-repository";
import { getLatestTrainingGeneration } from "@/server/training/training-generation-repository";
import {
  getTrainingSessionById,
  listTrainingSessions,
} from "@/server/training/training-session-repository";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{ source?: string }>;
}

export default async function TrainingBuilderPage({ searchParams }: PageProps) {
  const { source } = await searchParams;
  const [equipmentOptions, recentSessions] = await Promise.all([
    listTrainingEquipmentOptions(),
    listTrainingSessions(false, 60),
  ]);

  const sourceTrainingOptions: TrainingBuilderSourceOption[] = recentSessions.map((session) => ({
    id: session.id,
    title: session.title,
    totalDurationMinutes: session.totalDurationMinutes,
    itemCount: session.itemCount,
  }));

  const initialState = source
    ? await buildInitialState(source)
    : undefined;

  return (
    <AppShell
      title="Training Builder"
      subtitle="Schneller lokaler Plan oder detaillierter AI-/Sport-Builder – beide aus dem freigegebenen OCRCraft-Übungspool und mit derselben Sicherheitsprüfung."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/quick-create">
            Quick Create Wizard
          </Link>
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/training">
            Trainings
          </Link>
        </div>
      )}
    >
      <div className="space-y-6">
        <TrainingQuickPlanner equipmentOptions={equipmentOptions} />

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end" method="get">
            <label className="grid gap-1.5 text-sm font-black">
              Bestehendes generiertes Training als Basis
              <select
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                defaultValue={initialState?.sourceTrainingId ?? ""}
                name="source"
              >
                <option value="">Neues Training</option>
                {sourceTrainingOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title} · {option.totalDurationMinutes} Min. · {option.itemCount} Übungen
                  </option>
                ))}
              </select>
            </label>
            <button
              className="min-h-11 rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]"
              type="submit"
            >
              Parameter laden
            </button>
            {initialState ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm font-black"
                href="/training/builder"
              >
                Zurücksetzen
              </Link>
            ) : null}
          </form>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Es werden die beim Erzeugen gespeicherten Builder-Parameter geladen. Das bestehende Training wird nicht überschrieben; Speichern erzeugt immer einen neuen Entwurf.
          </p>
          {source && !initialState ? (
            <p className="mt-2 text-xs font-bold text-[var(--danger)]">
              Für dieses Training ist keine gültige Builder-Generation-History verfügbar. Es bleibt unverändert.
            </p>
          ) : null}
        </section>

        <details className="group" open>
          <summary className="mb-4 cursor-pointer text-sm font-black text-[var(--muted)]">Detaillierten Builder anzeigen</summary>
          <TrainingBuilderPanel
            equipmentOptions={equipmentOptions}
            initialState={initialState}
            sourceTrainingOptions={sourceTrainingOptions}
          />
        </details>
      </div>
    </AppShell>
  );
}

async function buildInitialState(trainingId: string): Promise<TrainingBuilderInitialState | undefined> {
  const [session, generation] = await Promise.all([
    getTrainingSessionById(trainingId),
    getLatestTrainingGeneration(trainingId),
  ]);
  if (!session || !generation) return undefined;

  const request = generation.request;
  const exerciseById = new Map(
    session.phases.flatMap((phase) => phase.items)
      .flatMap((item) => item.exerciseId ? [[item.exerciseId, item.exerciseName] as const] : []),
  );

  return {
    sourceTrainingId: session.id,
    sourceTitle: session.title,
    builderMode: generation.builderMode,
    audience: request.audience,
    minAge: request.minAge,
    maxAge: request.maxAge,
    participantCount: request.participantCount,
    durationMinutes: request.durationMinutes,
    goals: request.goals,
    bodyRegions: request.bodyRegions,
    avoidBodyRegions: request.avoidBodyRegions,
    exerciseTypes: request.exerciseTypes,
    formats: request.formats,
    location: request.location,
    intensity: request.intensity,
    warmupExerciseCount: request.warmupExerciseCount,
    mainExerciseCount: request.mainExerciseCount,
    mainPartExerciseCounts: request.mainPartExerciseCounts,
    cooldownExerciseCount: request.cooldownExerciseCount,
    mainPartCount: request.mainPartCount,
    organizationMode: request.organizationMode,
    teamSize: request.teamSize,
    sourceTrainingIds: request.sourceTrainingIds,
    preferredExercises: request.preferredExerciseIds.map((id) => ({
      id,
      label: exerciseById.get(id) ?? id,
      category: "Gespeicherte Wunschübung",
    })),
    availableEquipment: request.availableEquipment,
  };
}
