import Link from "next/link";
import { notFound } from "next/navigation";
import { TrainingPresentationControls } from "@/components/training/training-presentation-controls";
import { TrainingReadonlySession } from "@/components/training/training-readonly-session";
import { getTrainingExerciseGuidanceMap } from "@/server/training/training-exercise-guidance-repository";
import { getTrainingSessionById } from "@/server/training/training-session-repository";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function TrainingTrainerPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getTrainingSessionById(id);
  if (!session) notFound();

  const exerciseIds = session.phases.flatMap((phase) =>
    phase.items.flatMap((item) => item.exerciseId ? [item.exerciseId] : []),
  );
  const guidanceByExerciseId = await getTrainingExerciseGuidanceMap(exerciseIds, session.locale);

  return (
    <main
      className="min-h-screen overflow-auto bg-[var(--background)] p-4 text-[var(--foreground)] sm:p-6 lg:p-8 fullscreen:p-4"
      id="training-trainer-view"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <span className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black text-[var(--muted)]">Readonly-Ansicht</span>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
              href={`/training/${session.id}/print`}
            >
              Druckansicht
            </Link>
            <TrainingPresentationControls fullscreenTargetId="training-trainer-view" showPrint={false} />
          </div>
        </div>

        <TrainingReadonlySession
          guidanceByExerciseId={guidanceByExerciseId}
          presentation="trainer"
          session={session}
        />
      </div>
    </main>
  );
}
