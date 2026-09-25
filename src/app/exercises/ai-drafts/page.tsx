import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OverviewLayout } from "@/components/overview-layout";
import { CatalogFilterPanel, CatalogPageSize } from "@/components/catalog/catalog-filter-panel";
import { CatalogPagination } from "@/components/catalog/catalog-controls";
import { CatalogSummaryStrip } from "@/components/catalog/catalog-workspace";
import { Disclosure } from "@/components/ui/disclosure";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/card";
import { ConfirmPopoverForm } from "@/components/ui/confirm-popover-form";
import { buttonClass, formControlClass } from "@/components/ui/form";
import { exerciseCategoryLabels, exercisePhaseLabels } from "@/domain/exercise/model";
import { getConfiguredAiExerciseDraftProvider } from "@/server/exercises/ai-exercise-draft-provider";
import { countAiExerciseDrafts, listAiExerciseDrafts } from "@/server/exercises/ai-exercise-draft-repository";
import {
  approveAiExerciseDraftAction,
  approveAllAiExerciseDraftsAction,
  generateAiExerciseDraftAction,
  rejectAiExerciseDraftAction,
} from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    saved?: string;
    error?: string;
    batchApproved?: string;
    batchSkipped?: string;
    history?: string;
    q?: string;
    page?: string;
    size?: string;
  }>;
}

export default async function AiExerciseDraftsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const showHistory = query.history === "1";
  const searchQuery = query.q?.trim().toLocaleLowerCase("de-DE") ?? "";
  const requestedSize = Number(query.size ?? "12");
  const pageSize = [6, 12, 24].includes(requestedSize) ? requestedSize : 12;
  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const provider = await getConfiguredAiExerciseDraftProvider();
  const draftStatus = showHistory ? undefined : "pending";
  const [draftTotal, drafts] = await Promise.all([
    countAiExerciseDrafts(draftStatus, searchQuery),
    listAiExerciseDrafts(draftStatus, pageSize, searchQuery, (page - 1) * pageSize),
  ]);

  return (
    <AppShell
      title="AI-Übungsentwürfe"
      subtitle="AI darf Vorschläge vorbereiten. Erst eine ausdrückliche Trainerfreigabe erzeugt eine aktive OCRCraft-Übung."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link
            className={buttonClass("secondary", "px-4")}
            href={showHistory ? "/exercises/ai-drafts" : "/exercises/ai-drafts?history=1"}
          >
            {showHistory ? "Offene Entwürfe" : "Verlauf"}
          </Link>
          {!showHistory ? (
            <div data-tour="ai-draft-approval-action"><ConfirmPopoverForm action={approveAllAiExerciseDraftsAction} confirmLabel="Alle freigeben" description="Alle freigabefähigen AI-Entwürfe werden als Übungen angelegt. Entwürfe mit Review-Blockern bleiben offen." title="Alle freigabefähigen Entwürfe freigeben?" triggerClassName={buttonClass("accent", "px-4")} triggerLabel="Alle freigeben" /></div>
          ) : null}
          <Link
            className={buttonClass("secondary", "px-4")}
            href="/exercises"
          >
            ← Übungsbibliothek
          </Link>
        </div>
      )}
    >
      <OverviewLayout storageKey="ocrcraft-ai-drafts-view"><div className="space-y-6">
        {query.saved ? (
          <Alert tone="success">{query.saved === "rejected" ? "AI-Entwurf wurde verworfen." : "AI-Entwurf wurde erzeugt und wartet auf Trainerprüfung."}</Alert>
        ) : null}
        {query.error ? <ErrorNotice code={query.error} /> : null}
        {query.batchApproved ? (
          <Alert tone="success">
            {query.batchApproved} AI-Entwurf/Entwürfe wurden freigegeben. {query.batchSkipped ?? "0"} Entwurf/Entwürfe blieben wegen Review-Blockern oder eines parallelen Vorgangs offen.
          </Alert>
        ) : null}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6" data-tour="ai-draft-create">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Entwurf erzeugen</div>
              <h2 className="mt-1 text-xl font-black">Neue Übungsidee als Review-Draft</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Beschreibe Trainingszweck, Zielgruppe, verfügbares Equipment und gewünschte Übungsart. Der Provider erzeugt nur einen bilingualen Basisentwurf. Muskeln, Gegenmuskeln, Ausführung, Coaching, Sicherheit und Level werden nach Freigabe im vollständigen Editor geprüft und ergänzt.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-black">
              {provider ? `${provider.id} · ${provider.modelId ?? "Modell"}` : "AI nicht konfiguriert"}
            </span>
          </div>

          <form action={generateAiExerciseDraftAction} className="mt-5 space-y-3">
            <label className="grid gap-2 text-sm font-black">
              Briefing
              <textarea
                className={`${formControlClass} min-h-32 p-3 font-normal leading-6`}
                maxLength={3000}
                minLength={10}
                name="brief"
                placeholder="z. B. Eine gelenkschonende Partnerübung für Erwachsene, die Griffkraft und Rumpfstabilität trainiert, indoor ohne Zusatzgewicht funktioniert und gut als Hauptteil-Station geeignet ist."
                required
              />
            </label>
            <div className="flex justify-end">
              <button
                className={buttonClass("primary", "px-5")}
                disabled={!provider}
                type="submit"
              >
                AI-Entwurf erzeugen
              </button>
            </div>
          </form>
        </section>

        <section className="catalog-results space-y-4" data-tour="ai-draft-review">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Review Queue</div>
            <h2 className="mt-1 text-xl font-black">{showHistory ? "Alle AI-Entwürfe" : "Offene AI-Entwürfe"}</h2>
          </div>

          <div className="catalog-workspace grid min-w-0 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start" data-tour="ai-draft-filters">
          <CatalogFilterPanel hasFilters={Boolean(searchQuery || showHistory || page !== 1 || pageSize !== 12)} resetHref={showHistory ? "/exercises/ai-drafts?history=1" : "/exercises/ai-drafts"} title="Entwurfsfilter">
              {showHistory ? <input name="history" type="hidden" value="1" /> : null}
              <label className="grid gap-1 text-sm font-bold">
                Suchen
                <input className={`${formControlClass} min-w-0 font-normal`} defaultValue={query.q ?? ""} name="q" placeholder="z. B. Carry, Partner, Grip ..." />
              </label>
              <CatalogPageSize options={[6, 12, 24]} value={pageSize} />
          </CatalogFilterPanel>
          <div className="min-w-0 space-y-4">
          <CatalogSummaryStrip items={[{
            label: draftTotal === 1 ? "Entwurf" : "Entwürfe",
            value: draftTotal === 0 ? "0" : `${Math.min((page - 1) * pageSize + 1, draftTotal)}–${Math.min(page * pageSize, draftTotal)} von ${draftTotal}`,
          }]} />
          {drafts.length === 0 ? (
            <EmptyState title={showHistory ? "Noch keine AI-Übungsentwürfe" : "Keine offenen AI-Übungsentwürfe"}>
              {showHistory ? "Es wurden bisher keine AI-Übungsentwürfe gespeichert." : "Alle AI-Übungsentwürfe wurden bearbeitet oder es gibt aktuell keine neuen Vorschläge."}
            </EmptyState>
          ) : (
            <div className="catalog-results grid gap-4 xl:grid-cols-2">
              {drafts.map((draft) => (
                <Card as="article" className="catalog-card min-w-0 p-5" key={draft.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">
                        {statusLabel(draft.status)} · {draft.providerModel ?? draft.providerId}
                      </div>
                      <h3 className="mt-1 text-lg font-black">{draft.proposal.nameDe}</h3>
                      <div className="text-sm font-semibold text-[var(--muted)]">{draft.proposal.nameEn}</div>
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-black">
                      {exerciseCategoryLabels[draft.proposal.category]} · {exercisePhaseLabels[draft.proposal.phase]}
                    </span>
                  </div>

                  <p className="view-summary mt-4 text-sm leading-6">{draft.proposal.summaryDe}</p>
                  <p className="view-detail mt-2 text-sm leading-6 text-[var(--muted)]">{draft.proposal.summaryEn}</p>

                  <dl className="view-secondary mt-4 grid gap-2 text-sm sm:grid-cols-3">
                    <Meta label="Risiko" value={riskLabel(draft.proposal.riskLevel)} />
                    <Meta label="Mindestalter" value={draft.proposal.minAge == null ? "–" : `${draft.proposal.minAge}+`} />
                    <Meta label="Aliase" value={String(draft.proposal.aliasesDe.length + draft.proposal.aliasesEn.length)} />
                  </dl>

                  {draft.proposal.rationale ? (
                    <div className="view-detail mt-4 rounded-xl bg-[var(--surface-subtle)] p-3 text-xs leading-5 text-[var(--muted)]">
                      <span className="font-black text-[var(--foreground)]">AI-Begründung: </span>{draft.proposal.rationale}
                    </div>
                  ) : null}

                  {draft.review ? (
                    <div className="view-secondary mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">Deterministischer Review</span>
                        <span className={draft.review.blocking
                          ? "rounded-full bg-[var(--danger-bg)] px-2.5 py-1 text-xs font-black text-[var(--danger)]"
                          : "rounded-full bg-[var(--success-bg)] px-2.5 py-1 text-xs font-black text-[var(--success-foreground)]"}>
                          {draft.review.blocking ? "Freigabe blockiert" : "Kein harter Blocker"}
                        </span>
                      </div>
                      {draft.review.issues.length ? (
                        <ul className="mt-3 space-y-2 text-xs leading-5">
                          {draft.review.issues.map((issue, index) => (
                            <li className={issue.severity === "blocker" ? "font-bold text-[var(--danger)]" : "text-[var(--muted)]"} key={issue.code + "-" + index}>
                              {issue.severity === "blocker" ? "Blocker" : "Hinweis"} · {issue.message}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-[var(--muted)]">Keine Konflikte mit aktiven Übungen oder Gruppenregeln erkannt.</p>
                      )}
                    </div>
                  ) : null}

                  <Disclosure className="view-detail mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]" summaryClassName="px-3 py-2 text-xs font-black" summary="Originales Trainer-Briefing">
                    <p className="border-t border-[var(--border)] p-3 text-sm leading-6 text-[var(--muted)]">{draft.requestText}</p>
                  </Disclosure>

                  {draft.status === "pending" ? (
                    <div className="view-actions mt-4 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
                      <ConfirmPopoverForm action={rejectAiExerciseDraftAction} confirmLabel="Entwurf verwerfen" description="Der AI-Entwurf wird verworfen und steht anschließend nicht mehr zur Freigabe bereit." title="AI-Entwurf verwerfen?" triggerClassName={buttonClass("danger", "px-4 text-xs")} triggerLabel="Verwerfen">
                        <input name="id" type="hidden" value={draft.id} />
                      </ConfirmPopoverForm>
                      {!draft.review?.blocking ? (
                        <ConfirmPopoverForm action={approveAiExerciseDraftAction} confirmLabel="Freigeben" description="Aus dem Entwurf wird eine aktive Übung angelegt und im vollständigen Editor geöffnet." title="AI-Entwurf freigeben?" triggerClassName={buttonClass("primary", "px-4 text-xs")} triggerLabel="Freigeben & im Voll-Editor öffnen">
                          <input name="id" type="hidden" value={draft.id} />
                        </ConfirmPopoverForm>
                      ) : null}
                    </div>
                  ) : draft.approvedExerciseId ? (
                    <div className="mt-4 flex justify-end border-t border-[var(--border)] pt-4">
                      <Link className={buttonClass("secondary", "px-3 text-xs")} href={`/exercises/${draft.approvedExerciseId}/edit`}>
                        Freigegebene Übung öffnen
                      </Link>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
          <CatalogPagination href={(nextPage) => pageHref(nextPage, showHistory, searchQuery, pageSize)} label="AI-Entwürfe" page={page} totalPages={Math.max(1, Math.ceil(draftTotal / pageSize))} />
          </div>
          </div>
        </section>
      </div></OverviewLayout>
    </AppShell>
  );
}

function pageHref(page: number, history: boolean, query: string, size: number): string {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (history) params.set("history", "1");
  if (query) params.set("q", query);
  return "/exercises/ai-drafts?" + params.toString();
}

function ErrorNotice({ code }: { readonly code: string }) {
  const message = code === "not-configured"
    ? "AI-Übungsentwürfe sind nicht konfiguriert."
    : code === "invalid-brief"
      ? "Das Briefing ist zu kurz oder ungültig."
      : code === "not-pending"
        ? "Dieser Entwurf wurde bereits bearbeitet oder von einem anderen Vorgang übernommen."
        : code === "approval"
          ? "Der Entwurf konnte nicht freigegeben werden. Prüfe insbesondere mögliche Namensduplikate."
          : code === "rejection"
            ? "Der Entwurf konnte nicht verworfen werden."
            : "Der AI-Entwurf konnte nicht erzeugt werden.";
  return <Alert tone="danger">{message}</Alert>;
}

function Meta({ label, value }: { readonly label: string; readonly value: string }) {
  return <div className="rounded-lg bg-[var(--surface-subtle)] p-2"><dt className="text-xs text-[var(--muted)]">{label}</dt><dd className="mt-0.5 font-black">{value}</dd></div>;
}

function statusLabel(status: string): string {
  if (status === "pending") return "Offen";
  if (status === "approving") return "Wird freigegeben";
  if (status === "approved") return "Freigegeben";
  if (status === "rejected") return "Verworfen";
  return status;
}

function riskLabel(risk: string): string {
  if (risk === "low") return "Niedrig";
  if (risk === "medium") return "Mittel";
  if (risk === "high") return "Hoch";
  return risk;
}
