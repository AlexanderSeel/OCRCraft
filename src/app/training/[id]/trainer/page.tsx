import { routeMetadata } from "@/config/route-titles";
import { notFound } from "next/navigation";
import { TrainingPresentationToolbar } from "@/components/training/training-presentation-toolbar";
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
        <TrainingPresentationToolbar sessionId={session.id} />

        <TrainingReadonlySession
          guidanceByExerciseId={guidanceByExerciseId}
          presentation="trainer"
          session={session}
        />
      </div>
    </main>
  );
}

export const metadata = routeMetadata("trainingPresent");
