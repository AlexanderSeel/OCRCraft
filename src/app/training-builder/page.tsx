import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AdvancedTrainingBuilder } from "@/components/training/advanced-training-builder";
import { listTrainingEquipmentOptions } from "@/server/training/training-draft-repository";

export const dynamic = "force-dynamic";

export default async function TrainingBuilderPage() {
  const equipmentOptions = await listTrainingEquipmentOptions();
  const aiAvailable = Boolean(
    process.env.OCRCRAFT_AI_BASE_URL?.trim() && process.env.OCRCRAFT_AI_MODEL?.trim(),
  );

  return (
    <AppShell
      title="Training Builder"
      subtitle="Lokaler Sportalgorithmus oder AI auf demselben freigegebenen Übungspool mit identischen deterministischen Prüfungen."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
            href="/quick-create"
          >
            Quick Create
          </Link>
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
            href="/training"
          >
            Gespeicherte Trainings
          </Link>
        </div>
      )}
    >
      <AdvancedTrainingBuilder
        aiAvailable={aiAvailable}
        equipmentOptions={equipmentOptions}
      />
    </AppShell>
  );
}
