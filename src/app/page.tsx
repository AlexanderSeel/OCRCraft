import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { buttonClass } from "@/components/ui/form";
import { getDashboardSnapshot } from "@/server/dashboard/dashboard-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <AppShell
      title="Dashboard"
      subtitle="Trainingsbetrieb, Übungspool, Gruppen und Content-Qualität auf einen Blick."
      actions={(
        <>
          <Link className={buttonClass("secondary", "hidden sm:inline-flex")} href="/training">Trainings öffnen</Link>
          <Link className={buttonClass("primary")} href="/quick-create">+ Quick Create</Link>
        </>
      )}
    >
      <DashboardOverview snapshot={snapshot} />
    </AppShell>
  );
}
