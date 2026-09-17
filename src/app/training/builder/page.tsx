import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TrainingBuilderPanel } from "@/components/training/training-builder-panel";
import { TrainingQuickPlanner } from "@/components/training/training-quick-planner";
import { listTrainingEquipmentOptions } from "@/server/training/training-draft-repository";

export const dynamic = "force-dynamic";

export default async function TrainingBuilderPage() {
  const equipmentOptions = await listTrainingEquipmentOptions();

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
        <details className="group" open>
          <summary className="mb-4 cursor-pointer text-sm font-black text-[var(--muted)]">Detaillierten Builder anzeigen</summary>
          <TrainingBuilderPanel equipmentOptions={equipmentOptions} />
        </details>
      </div>
    </AppShell>
  );
}
