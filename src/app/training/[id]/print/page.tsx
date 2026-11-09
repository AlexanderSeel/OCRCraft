import { routeMetadata } from "@/config/route-titles";
import Link from "next/link";
import { buttonClass } from "@/components/ui/form";
import { notFound } from "next/navigation";
import { TrainingPresentationControls } from "@/components/training/training-presentation-controls";
import { TrainingReadonlySession } from "@/components/training/training-readonly-session";
import { getTrainingExerciseGuidanceMap } from "@/server/training/training-exercise-guidance-repository";
import { getTrainingSessionById } from "@/server/training/training-session-repository";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ details?: string | string[] }>;
}

export default async function TrainingPrintPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const fullDetails = (await searchParams).details === "full";
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
          --foreground: #111111;
          --muted: #333333;
          --border: #bbbbbb;
          --surface: #ffffff;
          --surface-subtle: #ffffff;
          --surface-elevated: #ffffff;
          --warning-border: #d71939;
          --warning-bg: #ffffff;
        }
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #fff !important; color-scheme: light; }
        }
      `}</style>

      <div className="mx-auto max-w-[210mm]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            className={buttonClass("secondary")}
            href={`/training/${session.id}`}
          >
            ← {session.locale === "en" ? "Training session" : "Training"}
          </Link>
          <Link className={buttonClass("secondary")} href={`/training/${session.id}/print${fullDetails ? "" : "?details=full"}`}>
            {session.locale === "en" ? (fullDetails ? "Compact session plan" : "Include all exercise details") : (fullDetails ? "Kompakter Trainingsplan" : "Mit allen Übungsdetails")}
          </Link>
          <TrainingPresentationControls showPrint />
        </div>

        <TrainingReadonlySession
          guidanceByExerciseId={guidanceByExerciseId}
          presentation="print"
          printDetail={fullDetails ? "full" : "compact"}
          session={session}
        />
      </div>
    </main>
  );
}

export const metadata = routeMetadata("trainingPrint");
