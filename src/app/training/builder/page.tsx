import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TrainingBuilderPanel } from "@/components/training/training-builder-panel";
import { listTrainingEquipmentOptions } from "@/server/training/training-draft-repository";

export const dynamic = "force-dynamic";

export default async function TrainingBuilderPage() {
  const equipmentOptions = await listTrainingEquipmentOptions();

  return (
    <AppShell
      title="Training Builder"
      subtitle="Trainingslehre-basierte lokale Planung oder AI-Vorschlag – beide aus dem freigegebenen OCRCraft-Übungspool und mit derselben Sicherheitsprüfung."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/quick-create">
            Quick Create
          </Link>
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/training">
            Trainings
          </Link>
        </div>
      )}
    >
      <TrainingBuilderPanel equipmentOptions={equipmentOptions} />
    </AppShell>
  );
}
