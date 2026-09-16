import { AppShell } from "@/components/app-shell";
import { QuickCreateWizard } from "@/components/training/quick-create-wizard";

export default function QuickCreatePage() {
  return (
    <AppShell
      title="Quick Create"
      subtitle="Von Gruppe und Trainingsziel zum strukturierten OCR-Trainingsentwurf."
      actions={
        <a
          className="inline-flex rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-bold hover:bg-[var(--surface-subtle)]"
          href="/"
        >
          Zur Übersicht
        </a>
      }
    >
      <QuickCreateWizard />
    </AppShell>
  );
}
