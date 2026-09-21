import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OverviewLayout } from "@/components/overview-layout";
import { CatalogFilterPanel, CatalogPageSize } from "@/components/catalog/catalog-filter-panel";
import { CatalogPagination } from "@/components/catalog/catalog-controls";
import { CatalogSummaryStrip } from "@/components/catalog/catalog-workspace";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { buttonClass, formControlClass } from "@/components/ui/form";
import { listTrainingSessionsPage, type TrainingSessionStatus } from "@/server/training/training-session-repository";

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  draft: "Entwurf",
  ready: "Bereit",
  completed: "Abgeschlossen",
  archived: "Archiviert",
} as const;

interface PageProps {
  readonly searchParams: Promise<{ status?: string; q?: string; page?: string; size?: string }>;
}
export default async function TrainingPage({ searchParams }: PageProps) {
  const { status, q, page: pageParam, size: sizeParam } = await searchParams;
  const archived = status === "archived";
  const query = q?.trim() ?? "";
  const selectedStatus = ["draft", "ready", "completed", "archived"].includes(status ?? "") ? status as TrainingSessionStatus : "";
  const requestedSize = Number(sizeParam ?? "24");
  const pageSize = [12, 24, 48].includes(requestedSize) ? requestedSize : 24;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const sessionPage = await listTrainingSessionsPage({ includeArchived: archived, query, status: archived ? "archived" : selectedStatus === "archived" ? "" : selectedStatus, limit: pageSize, offset: (page - 1) * pageSize });
  const sessions = sessionPage.items;
  const totalMinutes = sessionPage.totalMinutes;
  const draftCount = sessionPage.draftCount;

  return (
    <AppShell
      title={archived ? "Training · Archiv" : "Training"}
      subtitle={archived
        ? "Archivierte Einheiten ansehen und bei Bedarf über die Detailseite wiederherstellen."
        : "Gespeicherte Einheiten aus Quick Create, lokalem Sportalgorithmus, AI Builder und Training Editor."}
      actions={archived ? undefined : (
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
            href="/training/templates"
          >
            Vorlagen
          </Link>
          <Link
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
            href="/training/builder"
          >
            Training Builder
          </Link>
          <Link
            className="rounded-md bg-[var(--brand)] px-3.5 py-2.5 text-sm font-black text-[var(--brand-foreground)] hover:bg-[var(--brand-strong)]"
            href="/quick-create"
          >
            + Quick Create
          </Link>
        </div>
      )}
    >
      <OverviewLayout storageKey="ocrcraft-training-view"><div className="space-y-4">
        <CatalogSummaryStrip items={[
          { label: archived ? "Archivierte Trainings" : "Trainings", value: sessionPage.total },
          { label: "Offene Entwürfe", value: draftCount },
          { label: "Geplante Minuten", value: totalMinutes },
        ]} />

        <div className="catalog-workspace grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <CatalogFilterPanel hasFilters={Boolean(query || selectedStatus || page !== 1 || pageSize !== 24)} resetHref={archived ? "/training?status=archived" : "/training"} title="Trainingsfilter">
          <label className="grid gap-1 text-sm font-bold">Suchen<input className={formControlClass} defaultValue={query} name="q" placeholder="Trainingstitel …" /></label>
          {!archived ? <label className="grid gap-1 text-sm font-bold">Status<select className={formControlClass} defaultValue={selectedStatus} name="status"><option value="">Alle aktiven</option><option value="draft">Entwurf</option><option value="ready">Bereit</option><option value="completed">Abgeschlossen</option></select></label> : null}
          <CatalogPageSize options={[12, 24, 48]} value={pageSize} />
        </CatalogFilterPanel>
        <main className="min-w-0 space-y-4">
        <div className="flex justify-end text-sm font-bold">
          {archived ? (
            <Link className={buttonClass("secondary", "px-3")} href="/training">
              Aktive Trainings anzeigen
            </Link>
          ) : (
            <Link className={buttonClass("secondary", "px-3")} href="/training?status=archived">
              Archiv anzeigen
            </Link>
          )}
        </div>

        {sessions.length > 0 ? (
          <section className="catalog-results grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <Card
                as="article"
                className="catalog-card min-w-0 flex min-h-48 flex-col p-4"
                key={session.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {sourceLabel(session.source)}
                    </div>
                    <h2 className="mt-1 break-words text-lg font-black">{session.title}</h2>
                  </div>
                  <span className="shrink-0 rounded-sm border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-1 text-[11px] font-bold">
                    {STATUS_LABELS[session.status]}
                  </span>
                </div>

                <dl className="view-secondary mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-[var(--surface-subtle)] p-2.5">
                    <dt className="text-xs font-bold text-[var(--muted)]">Dauer</dt>
                    <dd className="mt-1 font-black">{session.totalDurationMinutes} Min.</dd>
                  </div>
                  <div className="rounded-md bg-[var(--surface-subtle)] p-2.5">
                    <dt className="text-xs font-bold text-[var(--muted)]">Übungen</dt>
                    <dd className="mt-1 font-black">{session.itemCount}</dd>
                  </div>
                </dl>

                <div className="mt-auto pt-4">
                  <div className="view-secondary mb-3 text-xs font-semibold text-[var(--muted)]">
                    Erstellt {formatCreatedAt(session.createdAt)} · {session.locale.toUpperCase()}
                  </div>
                  <div className="view-actions flex flex-wrap justify-end gap-2">
                    {!archived ? (
                      <Link
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black hover:bg-[var(--surface-subtle)]"
                        href={`/training/${session.id}/combine`}
                      >
                        Kombinieren
                      </Link>
                    ) : null}
                    <Link
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black hover:bg-[var(--surface-subtle)]"
                      href={`/training/${session.id}/trainer`}
                    >
                      Trainermodus
                    </Link>
                    <Link
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black hover:bg-[var(--surface-subtle)]"
                      href={`/training/${session.id}/print`}
                    >
                      Drucken
                    </Link>
                    <Link
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black hover:bg-[var(--surface-subtle)]"
                      href={`/training/${session.id}`}
                    >
                      {archived ? "Ansehen / Wiederherstellen" : "Details"}
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        ) : (
          <EmptyState title={archived ? "Archiv ist leer" : "Noch kein Training gespeichert"}>
              {archived
                ? "Archivierte Einheiten erscheinen hier und können über ihre Detailseite wieder aktiviert werden."
                : "Nutze den Training Builder für gezielte lokale/AI-Planung oder Quick Create für einen schnellen deterministischen Entwurf."}
            {!archived ? (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link
                  className={buttonClass("secondary", "px-4")}
                  href="/training/builder"
                >
                  Training Builder öffnen
                </Link>
                <Link
                  className={buttonClass("primary", "px-4")}
                  href="/quick-create"
                >
                  Quick Create öffnen
                </Link>
              </div>
            ) : null}
          </EmptyState>
        )}
        <CatalogPagination href={(nextPage) => pageHref(nextPage, archived, query, selectedStatus, pageSize)} label="Trainings" page={page} totalPages={Math.max(1, Math.ceil(sessionPage.total / pageSize))} />
        </main>
        </div>
      </div></OverviewLayout>
    </AppShell>
  );
}

function pageHref(page: number, archived: boolean, query: string, status: string, size: number): string {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (archived) params.set("status", "archived");
  else if (status) params.set("status", status);
  if (query) params.set("q", query);
  return "/training?" + params.toString();
}

function sourceLabel(source: string): string {
  if (source === "manual") return "Quick Create / lokaler Builder";
  if (source === "ai") return "AI Builder";
  if (source === "copied") return "Kopie";
  if (source === "combined") return "Kombiniert";
  if (source === "template") return "Vorlage";
  if (source === "imported") return "Importiert";
  return source;
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(date);
}
