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

export default async function TrainingPrintPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getTrainingSessionById(id);
  if (!session) notFound();

  const exerciseIds = session.phases.flatMap((phase) =>
    phase.items.flatMap((item) => item.exerciseId ? [item.exerciseId] : []),
  );
  const guidanceByExerciseId = await getTrainingExerciseGuidanceMap(exerciseIds, session.locale);

  return (
    <main className="min-h-screen bg-[var(--surface)] p-4 text-[var(--foreground)] sm:p-8 print:min-h-0 print:p-0" id="training-print-view">
      <style>{`
        #training-print-view {
          --foreground: #0f172a;
          --muted: #475569;
          --border: #cbd5e1;
          --surface: #ffffff;
          --surface-subtle: #f8fafc;
          --surface-elevated: #f1f5f9;
          --warning-border: #facc15;
          --warning-bg: #fefce8;
        }
        @media print {
          @page { margin: 12mm; }
          html, body { background: #fff !important; }
          details { break-inside: avoid; }
          details > summary { display: none; }
          details > div { display: grid !important; border-top: 0 !important; padding-top: 0.5rem !important; }
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
            href={`/training/${session.id}`}
          >
            ← Training
          </Link>
          <TrainingPresentationControls showPrint />
        </div>

        <TrainingReadonlySession
          guidanceByExerciseId={guidanceByExerciseId}
          presentation="print"
          session={session}
        />
      </div>
    </main>
  );
}
