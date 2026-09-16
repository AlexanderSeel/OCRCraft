import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { QuickCreateWizard } from "@/components/training/quick-create-wizard";
import { listTrainingEquipmentOptions } from "@/server/training/training-draft-repository";

export const dynamic = "force-dynamic";

export default async function QuickCreatePage() {
  const equipmentOptions = await listTrainingEquipmentOptions();

  return (
    <AppShell
      title="Quick Create"
      subtitle="Von Gruppe und Trainingsziel zum strukturierten OCR-Trainingsentwurf."
      actions={
        <Link
          className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold hover:bg-[var(--surface-subtle)]"
          href="/"
        >
          Zur Übersicht
        </Link>
      }
    >
      <QuickCreateWizard equipmentOptions={equipmentOptions} />
    </AppShell>
  );
}
