import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/form";
import { StatCard } from "@/components/ui/stat-card";
import { listTrainingSessionsPage } from "@/server/training/training-session-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionPage = await listTrainingSessionsPage({ includeArchived: false, limit: 6, offset: 0 });
  const sessions = sessionPage.items;
  const recent = sessions[0];
  const totalMinutes = sessionPage.totalMinutes;
  const draftCount = sessionPage.draftCount;

  return <AppShell title="Trainingsübersicht" subtitle="Schnell planen, sinnvoll skalieren und als Trainer die Kontrolle behalten." actions={<>
    <Link className={buttonClass("secondary", "hidden sm:inline-flex")} href="/training">Trainings öffnen</Link>
    <Link className={buttonClass("primary")} href="/quick-create">+ Quick Create</Link>
  </>}>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Letzte Einheit" value={recent ? `${recent.totalDurationMinutes} Min.` : "–"} detail={recent?.title ?? "Noch kein Training gespeichert"} />
      <StatCard label="Trainings" value={String(sessions.length)} detail={`${draftCount} offene Entwürfe`} />
      <StatCard label="Geplante Minuten" value={String(totalMinutes)} detail="Aus den letzten Trainings" />
      <StatCard label="Datenstatus" value={recent ? "Aktuell" : "Leer"} detail={recent ? "Trainingsdaten geladen" : "Erstelle dein erstes Training"} />
    </div>

    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div><div className="ui-kicker">Aktuelle Trainings</div><h2 className="mt-1 text-xl font-black tracking-[-0.025em]">Deine gespeicherten Einheiten</h2></div>
          <Link className="text-xs font-black text-[var(--brand)] hover:underline" href="/training">Alle Trainings →</Link>
        </div>

        {sessions.length ? <div className="space-y-2">{sessions.map((session) => (
          <Link className="group block" href={`/training/${session.id}`} key={session.id}>
            <Card as="article" className="p-4 transition hover:border-[var(--brand)] hover:bg-[var(--surface-elevated)]">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="ui-kicker">{sourceLabel(session.source)}</div>
                  <h3 className="mt-1 truncate text-base font-black group-hover:text-[var(--brand)]">{session.title}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
                    <span><strong className="text-[var(--foreground)]">{session.totalDurationMinutes} Min.</strong> Dauer</span>
                    <span><strong className="text-[var(--foreground)]">{session.itemCount}</strong> Übungen</span>
                    <span>{formatCreatedAt(session.createdAt)}</span>
                  </div>
                </div>
                <span className="w-fit rounded-sm border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-1 text-[11px] font-black">{statusLabel(session.status)}</span>
              </div>
            </Card>
          </Link>
        ))}</div> : <EmptyOverview />}
      </section>

      <aside className="space-y-3">
        <Card className="feature-panel border-[var(--sidebar-border)] bg-[var(--sidebar)] p-4 text-[var(--sidebar-foreground)] shadow-[var(--shadow-raised)]">
          <div className="text-[11px] font-black uppercase tracking-[0.11em] text-[var(--sidebar-muted)]">Schnellstart</div>
          <h2 className="mt-1.5 text-lg font-black">Neue Einheit, ohne Umwege.</h2>
          <p className="mt-1.5 text-sm leading-5 text-[var(--sidebar-muted)]">Gruppe, Dauer und Ziel wählen. OCRCraft erstellt einen bearbeitbaren Entwurf.</p>
          <Link className={buttonClass("accent", "mt-4 w-full")} href="/quick-create">Quick Create öffnen</Link>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2"><h2 className="font-black">Arbeitsbereich</h2><span className="text-[11px] font-bold text-[var(--muted)]">{recent ? "Daten aktiv" : "Noch leer"}</span></div>
          <div className="mt-3 grid gap-1.5 text-sm">
            <Link className="rounded-md border border-transparent bg-[var(--surface-subtle)] px-3 py-2.5 font-bold hover:border-[var(--brand)]" href="/exercises">Übungspool aufbauen</Link>
            <Link className="rounded-md border border-transparent bg-[var(--surface-subtle)] px-3 py-2.5 font-bold hover:border-[var(--brand)]" href="/groups">Vereinsgruppen definieren</Link>
            <Link className="rounded-md border border-transparent bg-[var(--surface-subtle)] px-3 py-2.5 font-bold hover:border-[var(--brand)]" href="/training/templates">Trainingsvorlagen ansehen</Link>
          </div>
        </Card>
      </aside>
    </div>
  </AppShell>;
}

function statusLabel(status: string): string { return status === "draft" ? "Entwurf" : status === "ready" ? "Bereit" : status === "completed" ? "Abgeschlossen" : "Archiviert"; }
function sourceLabel(source: string): string { return source === "manual" ? "Quick Create / lokaler Builder" : source === "ai" ? "AI Builder" : source === "template" ? "Vorlage" : source; }
function formatCreatedAt(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeZone: "Europe/Berlin" }).format(date); }
function EmptyOverview() { return <Card className="border-dashed p-6 text-center"><h3 className="font-black">Noch kein Training gespeichert</h3><p className="mt-1.5 text-sm text-[var(--muted)]">Erstelle deine erste Einheit mit Quick Create.</p><Link className={buttonClass("primary", "mt-4")} href="/quick-create">Quick Create öffnen</Link></Card>; }
