import Link from "next/link";
import type { DashboardActivityBucket, DashboardBucket, DashboardRecentTraining, DashboardSnapshot } from "@/server/dashboard/dashboard-repository";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/form";
import { StatCard } from "@/components/ui/stat-card";

export function DashboardOverview({ snapshot }: { readonly snapshot: DashboardSnapshot }) {
  return (
    <div className="space-y-4">
      <section aria-label="Dashboard Kennzahlen" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Trainings" value={String(snapshot.training.total)} detail={`${snapshot.training.draft} Entwürfe · ${snapshot.training.ready} bereit`} />
        <StatCard label="Trainingsvolumen" value={formatMinutes(snapshot.training.totalMinutes)} detail={`${snapshot.training.completed} abgeschlossen`} />
        <StatCard label="Übungspool" value={String(snapshot.exercises.active)} detail={`${snapshot.exercises.games} Spiele · ${snapshot.exercises.categories.length} Kategorien`} />
        <StatCard label="Vereinsgruppen" value={String(snapshot.groups.active)} detail={snapshot.groups.withoutTraining ? `${snapshot.groups.withoutTraining} noch ohne Training` : "Alle mit Training verknüpft"} />
        <StatCard label="Medienreview" value={String(snapshot.media.pendingReview)} detail={snapshot.media.failed ? `${snapshot.media.failed} fehlgeschlagene Assets` : "Keine fehlgeschlagenen Assets"} />
      </section>

      <section aria-label="Schnellaktionen" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction href="/quick-create" kicker="Schnell" title="Quick Create" detail="Ein Training in wenigen Schritten aufbauen." primary />
        <QuickAction href="/training/builder" kicker="Gezielt" title="Training Builder" detail="Ziele, Muskeln, Formate und Equipment steuern." />
        <QuickAction href="/exercises/new" kicker="Bibliothek" title="Neue Übung" detail="Übung mit Klassifikation und Guidance anlegen." />
        <QuickAction href="/media?review=pending" kicker="Qualität" title="Medien prüfen" detail={snapshot.media.pendingReview ? `${snapshot.media.pendingReview} Medien warten auf Review.` : "Aktuell kein offenes Review."} />
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,.65fr)]">
        <ActivityCard activity={snapshot.training.activity} draft={snapshot.training.draft} ready={snapshot.training.ready} completed={snapshot.training.completed} sources={snapshot.training.sources} />
        <OperationsCard snapshot={snapshot} />
      </div>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,.75fr)]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
            <div><div className="ui-kicker">Aktivität</div><h2 className="mt-1 text-base font-black">Letzte Trainings</h2></div>
            <Link className="text-xs font-black text-[var(--brand)] hover:underline" href="/training">Alle Trainings →</Link>
          </div>
          {snapshot.training.recent.length ? (
            <div className="divide-y divide-[var(--border)]">
              {snapshot.training.recent.map((training) => (
                <Link className="group grid gap-2 px-4 py-3 transition hover:bg-[var(--surface-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" href={`/training/${training.id}`} key={training.id}>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-black group-hover:text-[var(--brand)]">{training.title}</h3>
                      <StatusBadge status={training.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                      <span>{sourceLabel(training.source)}</span><span>{training.durationMinutes} Min.</span><span>{training.itemCount} Übungen</span><span>{formatCreatedAt(training.createdAt)}</span>
                    </div>
                  </div>
                  <span aria-hidden="true" className="hidden text-lg font-black text-[var(--border-strong)] sm:block">›</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center"><p className="text-sm font-bold">Noch kein Training gespeichert.</p><Link className={buttonClass("primary", "mt-3")} href="/quick-create">Erstes Training erstellen</Link></div>
          )}
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <div className="border-b border-[var(--border)] px-4 py-3"><div className="ui-kicker">Handlungsbedarf</div><h2 className="mt-1 text-base font-black">Workflow-Status</h2></div>
          <div className="divide-y divide-[var(--border)]">
            <AttentionRow count={snapshot.training.draft} detail="Trainings warten auf Fertigstellung." href="/training?status=draft" label="Offene Entwürfe" />
            <AttentionRow count={snapshot.ai.pendingDrafts} detail="AI-Übungsentwürfe warten auf Trainerprüfung." href="/exercises/ai-drafts?status=pending" label="AI-Entwürfe" />
            <AttentionRow count={snapshot.media.pendingReview} detail="Medien benötigen fachliches Review." href="/media?review=pending" label="Medienreview" />
            <AttentionRow count={snapshot.media.queue.failedRecent} detail="Bildjobs sind in den letzten 24 Stunden fehlgeschlagen." href="/media" label="Bildgenerierung 24h" />
            <AttentionRow count={snapshot.obstacles.highRisk} detail="Aktive Hindernisse mit hohem Risiko." href="/obstacles?risk=high" label="High-Risk Hindernisse" />
            <AttentionRow count={snapshot.groups.withoutTraining} detail="Aktive Gruppen ohne verknüpftes Training." href="/groups" label="Gruppen ohne Training" />
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        <DistributionCard buckets={snapshot.exercises.categories} emptyText="Noch keine aktiven Übungen vorhanden." href="/exercises" labelForKey={exerciseCategoryLabel} title="Übungspool" total={snapshot.exercises.active} />
        <DistributionCard buckets={snapshot.groups.audiences} emptyText="Noch keine Vereinsgruppen vorhanden." href="/groups" labelForKey={audienceLabel} title="Gruppenstruktur" total={snapshot.groups.active} />
        <Card className="p-4">
          <div className="flex items-start justify-between gap-2"><div><div className="ui-kicker">Readiness</div><h2 className="mt-1 text-base font-black">Inhaltsqualität</h2></div><Link className="text-xs font-black text-[var(--brand)] hover:underline" href="/media">Medien →</Link></div>
          <div className="mt-4 space-y-4">
            <ProgressMetric label="Medien freigegeben" value={snapshot.media.approved} total={snapshot.media.total} />
            <ProgressMetric label="Medien generiert" value={snapshot.media.generated} total={snapshot.media.total} />
            <ProgressMetric label="Hindernisse mit Club-Maßen" value={snapshot.obstacles.withClubDimensions} total={snapshot.obstacles.active} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3 text-xs">
            <Link className="rounded-md bg-[var(--surface-subtle)] px-3 py-2 font-bold hover:text-[var(--brand)]" href="/games">Spiele <strong className="float-right text-[var(--foreground)]">{snapshot.exercises.games}</strong></Link>
            <Link className="rounded-md bg-[var(--surface-subtle)] px-3 py-2 font-bold hover:text-[var(--brand)]" href="/obstacles">Hindernisse <strong className="float-right text-[var(--foreground)]">{snapshot.obstacles.active}</strong></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ActivityCard({ activity, draft, ready, completed, sources }: {
  readonly activity: readonly DashboardActivityBucket[];
  readonly draft: number;
  readonly ready: number;
  readonly completed: number;
  readonly sources: readonly DashboardBucket[];
}) {
  const maxCount = Math.max(1, ...activity.map((item) => item.count));
  return (
    <Card className="min-w-0 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="ui-kicker">8 Wochen</div><h2 className="mt-1 text-base font-black">Trainingsaktivität</h2></div>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-black">
          <StatusChip label="Entwurf" value={draft} tone="warning" />
          <StatusChip label="Bereit" value={ready} tone="accent" />
          <StatusChip label="Abgeschlossen" value={completed} tone="success" />
        </div>
      </div>
      {activity.length ? (
        <div className="mt-4 grid min-h-36 grid-cols-4 items-end gap-2 sm:grid-cols-8" aria-label="Trainings pro Woche">
          {activity.map((item) => {
            const height = Math.max(12, Math.round((item.count / maxCount) * 100));
            return (
              <div className="grid min-w-0 gap-1.5" key={item.weekStart}>
                <div className="flex h-24 items-end rounded-sm bg-[var(--surface-subtle)] p-0.5" title={`${item.count} Trainings · ${item.minutes} Minuten`}>
                  <div className="w-full rounded-sm bg-[var(--brand)]" style={{ height: `${height}%` }} />
                </div>
                <div className="min-w-0 text-center"><div className="text-xs font-black">{item.count}</div><div className="truncate text-[10px] text-[var(--muted)]">{formatWeek(item.weekStart)}</div></div>
              </div>
            );
          })}
        </div>
      ) : <p className="mt-4 text-sm text-[var(--muted)]">In den letzten acht Wochen wurden noch keine Trainings gespeichert.</p>}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
        <span className="font-bold text-[var(--foreground)]">Quellen</span>
        {sources.length ? sources.map((source) => <span key={source.key}>{sourceLabel(source.key)} <strong className="text-[var(--foreground)]">{source.count}</strong></span>) : <span>Noch keine Trainingsquellen</span>}
      </div>
    </Card>
  );
}

function OperationsCard({ snapshot }: { readonly snapshot: DashboardSnapshot }) {
  const activeImageJobs = snapshot.media.queue.queued + snapshot.media.queue.running;
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="border-b border-[var(--border)] px-4 py-3"><div className="ui-kicker">Pipelines</div><h2 className="mt-1 text-base font-black">AI & Content Ops</h2></div>
      <div className="grid grid-cols-2 border-b border-[var(--border)]">
        <OperationMetric href="/exercises/ai-drafts?status=pending" label="AI Drafts" value={snapshot.ai.pendingDrafts + snapshot.ai.approvingDrafts} detail={snapshot.ai.approvingDrafts ? `${snapshot.ai.approvingDrafts} in Freigabe` : "Trainerreview"} />
        <OperationMetric href="/media" label="Bildjobs" value={activeImageJobs} detail={snapshot.media.queue.running ? `${snapshot.media.queue.running} laufen` : "Queue"} />
        <OperationMetric href="/games" label="Spiele" value={snapshot.exercises.games} detail="Aktiver Katalog" />
        <OperationMetric href="/media?review=pending" label="Review" value={snapshot.media.pendingReview} detail="Offene Medien" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
        <PipelineState label="24h erfolgreich" value={snapshot.media.queue.succeededRecent} good />
        <PipelineState label="24h fehlgeschlagen" value={snapshot.media.queue.failedRecent} />
      </div>
    </Card>
  );
}

function OperationMetric({ href, label, value, detail }: { readonly href: string; readonly label: string; readonly value: number; readonly detail: string }) {
  return <Link className="min-w-0 border-r border-t border-[var(--border)] px-3 py-3 first:border-t-0 even:border-r-0 hover:bg-[var(--surface-subtle)]" href={href}><div className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--muted)]">{label}</div><div className="mt-1 text-xl font-black tracking-[-0.03em]">{value}</div><div className="truncate text-[10px] text-[var(--muted)]">{detail}</div></Link>;
}

function PipelineState({ label, value, good = false }: { readonly label: string; readonly value: number; readonly good?: boolean }) {
  return <div className="bg-[var(--surface)] px-3 py-2.5"><div className="text-[10px] text-[var(--muted)]">{label}</div><div className={`mt-0.5 text-sm font-black ${good ? "text-[var(--success)]" : value > 0 ? "text-[var(--danger)]" : "text-[var(--foreground)]"}`}>{value}</div></div>;
}

function StatusChip({ label, value, tone }: { readonly label: string; readonly value: number; readonly tone: "warning" | "accent" | "success" }) {
  const classes = tone === "warning" ? "border-[var(--warning)] bg-[var(--warning-bg)]" : tone === "success" ? "border-[var(--success-border)] bg-[var(--success-bg)]" : "border-[var(--accent-strong)] bg-[var(--accent-soft)]";
  return <span className={`rounded-sm border px-2 py-1 ${classes}`}>{label} {value}</span>;
}

function QuickAction({ href, kicker, title, detail, primary = false }: { readonly href: string; readonly kicker: string; readonly title: string; readonly detail: string; readonly primary?: boolean }) {
  return <Link className={`group relative overflow-hidden rounded-lg border p-3.5 transition ${primary ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]"}`} href={href}><div className="ui-kicker">{kicker}</div><div className="mt-1 flex items-center justify-between gap-2"><h2 className="text-sm font-black">{title}</h2><span aria-hidden="true" className="font-black text-[var(--brand)]">↗</span></div><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p></Link>;
}

function AttentionRow({ count, label, detail, href }: { readonly count: number; readonly label: string; readonly detail: string; readonly href: string }) {
  return <Link className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-[var(--surface-subtle)]" href={href}><span className={`grid size-8 place-items-center rounded-md text-xs font-black ${count > 0 ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]" : "bg-[var(--accent-soft)] text-[var(--foreground)]"}`}>{count}</span><span className="min-w-0"><strong className="block text-sm">{label}</strong><span className="block truncate text-xs text-[var(--muted)]">{count > 0 ? detail : "Kein offener Punkt."}</span></span><span aria-hidden="true" className="text-[var(--border-strong)]">›</span></Link>;
}

function DistributionCard({ buckets, title, total, href, emptyText, labelForKey }: { readonly buckets: readonly DashboardBucket[]; readonly title: string; readonly total: number; readonly href: string; readonly emptyText: string; readonly labelForKey: (key: string) => string }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return <Card className="p-4"><div className="flex items-start justify-between gap-2"><div><div className="ui-kicker">Verteilung</div><h2 className="mt-1 text-base font-black">{title}</h2></div><Link className="text-xs font-black text-[var(--brand)] hover:underline" href={href}>{total} gesamt →</Link></div>{buckets.length ? <div className="mt-4 space-y-2.5">{buckets.map((bucket) => <div key={bucket.key}><div className="mb-1 flex items-center justify-between gap-2 text-xs"><span className="truncate font-bold">{labelForKey(bucket.key)}</span><strong>{bucket.count}</strong></div><div className="h-1.5 overflow-hidden rounded-sm bg-[var(--surface-subtle)]" role="progressbar" aria-label={labelForKey(bucket.key)} aria-valuemax={max} aria-valuemin={0} aria-valuenow={bucket.count}><div className="h-full bg-[var(--accent-strong)]" style={{ width: `${Math.max(6, Math.round((bucket.count / max) * 100))}%` }} /></div></div>)}</div> : <p className="mt-4 text-sm text-[var(--muted)]">{emptyText}</p>}</Card>;
}

function ProgressMetric({ label, value, total }: { readonly label: string; readonly value: number; readonly total: number }) {
  const percent = percentage(value, total);
  return <div><div className="mb-1 flex items-center justify-between gap-2 text-xs"><span className="font-bold">{label}</span><span className="text-[var(--muted)]"><strong className="text-[var(--foreground)]">{value}</strong> / {total}</span></div><div className="h-2 overflow-hidden rounded-sm bg-[var(--surface-subtle)]" role="progressbar" aria-label={label} aria-valuemax={100} aria-valuemin={0} aria-valuenow={percent}><div className="h-full bg-[var(--brand)]" style={{ width: `${percent}%` }} /></div></div>;
}

function StatusBadge({ status }: { readonly status: DashboardRecentTraining["status"] }) {
  const classes = status === "ready" ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]" : status === "completed" ? "border-[var(--success-border)] bg-[var(--success-bg)]" : status === "draft" ? "border-[var(--warning)] bg-[var(--warning-bg)]" : "border-[var(--border)] bg-[var(--surface-subtle)]";
  return <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-black ${classes}`}>{statusLabel(status)}</span>;
}

function percentage(value: number, total: number): number { return total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / total) * 100))); }
function formatMinutes(minutes: number): string { if (minutes < 60) return `${minutes} Min.`; const hours = Math.floor(minutes / 60); const remainder = minutes % 60; return remainder ? `${hours}h ${remainder}m` : `${hours}h`; }
function formatCreatedAt(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeZone: "Europe/Berlin" }).format(date); }
function formatWeek(value: string): string { const date = new Date(value.replace(" ", "T")); return Number.isNaN(date.getTime()) ? value.slice(0, 10) : new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }).format(date); }
function statusLabel(status: DashboardRecentTraining["status"]): string { return status === "draft" ? "Entwurf" : status === "ready" ? "Bereit" : status === "completed" ? "Abgeschlossen" : "Archiviert"; }
function sourceLabel(source: string): string { return source === "manual" ? "Lokal / Quick Create" : source === "ai" ? "AI Builder" : source === "template" ? "Vorlage" : source; }
function audienceLabel(key: string): string { return key === "kids" ? "Kids" : key === "youth" ? "Youth" : key === "adults" ? "Erwachsene" : key === "mixed" ? "Gemischt" : key; }
function exerciseCategoryLabel(key: string): string {
  const labels: Readonly<Record<string, string>> = { "ocr-skill": "OCR-Technik", strength: "Kraft", endurance: "Ausdauer", mobility: "Mobility", coordination: "Koordination", running: "Laufen", warmup: "Warm-up", cooldown: "Cooldown", general: "Allgemein" };
  return labels[key] ?? key;
}
