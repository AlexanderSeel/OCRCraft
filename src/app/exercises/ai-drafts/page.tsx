import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Disclosure } from "@/components/ui/disclosure";
import { exerciseCategoryLabels, exercisePhaseLabels } from "@/domain/exercise/model";
import { getConfiguredAiExerciseDraftProvider } from "@/server/exercises/ai-exercise-draft-provider";
import { listAiExerciseDrafts } from "@/server/exercises/ai-exercise-draft-repository";
import {
  approveAiExerciseDraftAction,
  generateAiExerciseDraftAction,
  rejectAiExerciseDraftAction,
} from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    saved?: string;
    error?: string;
    history?: string;
  }>;
}

export default async function AiExerciseDraftsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const showHistory = query.history === "1";
  const provider = await getConfiguredAiExerciseDraftProvider();
  const drafts = await listAiExerciseDrafts(showHistory ? undefined : "pending");

  return (
    <AppShell
      title="AI-Übungsentwürfe"
      subtitle="AI darf Vorschläge vorbereiten. Erst eine ausdrückliche Trainerfreigabe erzeugt eine aktive OCRCraft-Übung."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black"
            href={showHistory ? "/exercises/ai-drafts" : "/exercises/ai-drafts?history=1"}
          >
            {showHistory ? "Offene Entwürfe" : "Verlauf"}
          </Link>
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black"
            href="/exercises"
          >
            ← Übungsbibliothek
          </Link>
        </div>
      )}
    >
      <div className="space-y-6">
        {query.saved ? (
          <Notice>{query.saved === "rejected" ? "AI-Entwurf wurde verworfen." : "AI-Entwurf wurde erzeugt und wartet auf Trainerprüfung."}</Notice>
        ) : null}
        {query.error ? <ErrorNotice code={query.error} /> : null}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
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
                className="min-h-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-normal leading-6 outline-none focus:border-[var(--focus)]"
                maxLength={3000}
                minLength={10}
                name="brief"
                placeholder="z. B. Eine gelenkschonende Partnerübung für Erwachsene, die Griffkraft und Rumpfstabilität trainiert, indoor ohne Zusatzgewicht funktioniert und gut als Hauptteil-Station geeignet ist."
                required
              />
            </label>
            <div className="flex justify-end">
              <button
                className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] disabled:opacity-50"
                disabled={!provider}
                type="submit"
              >
                AI-Entwurf erzeugen
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Review Queue</div>
            <h2 className="mt-1 text-xl font-black">{showHistory ? "Alle AI-Entwürfe" : "Offene AI-Entwürfe"}</h2>
          </div>

          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
              {showHistory ? "Noch keine AI-Übungsentwürfe vorhanden." : "Keine offenen AI-Übungsentwürfe."}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {drafts.map((draft) => (
                <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]" key={draft.id}>
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

                  <p className="mt-4 text-sm leading-6">{draft.proposal.summaryDe}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{draft.proposal.summaryEn}</p>

                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                    <Meta label="Risiko" value={riskLabel(draft.proposal.riskLevel)} />
                    <Meta label="Mindestalter" value={draft.proposal.minAge == null ? "–" : `${draft.proposal.minAge}+`} />
                    <Meta label="Aliase" value={String(draft.proposal.aliasesDe.length + draft.proposal.aliasesEn.length)} />
                  </dl>

                  {draft.proposal.rationale ? (
                    <div className="mt-4 rounded-xl bg-[var(--surface-subtle)] p-3 text-xs leading-5 text-[var(--muted)]">
                      <span className="font-black text-[var(--foreground)]">AI-Begründung: </span>{draft.proposal.rationale}
                    </div>
                  ) : null}

                  {draft.review ? (
                    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
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

                  <Disclosure className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]" summaryClassName="px-3 py-2 text-xs font-black" summary="Originales Trainer-Briefing">
                    <p className="border-t border-[var(--border)] p-3 text-sm leading-6 text-[var(--muted)]">{draft.requestText}</p>
                  </Disclosure>

                  {draft.status === "pending" ? (
                    <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-4">
                      <form action={rejectAiExerciseDraftAction}>
                        <input name="id" type="hidden" value={draft.id} />
                        <button className="min-h-10 rounded-lg border border-[var(--danger)] px-4 text-xs font-black text-[var(--danger)]" type="submit">
                          Verwerfen
                        </button>
                      </form>
                      <form action={approveAiExerciseDraftAction}>
                        <input name="id" type="hidden" value={draft.id} />
                        <button
                          className="min-h-10 rounded-lg bg-[var(--control-strong)] px-4 text-xs font-black text-[var(--control-strong-foreground)] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={Boolean(draft.review?.blocking)}
                          title={draft.review?.blocking ? "Harte Review-Blocker müssen zuerst aufgelöst werden." : undefined}
                          type="submit"
                        >
                          Freigeben & im Voll-Editor öffnen
                        </button>
                      </form>
                    </div>
                  ) : draft.approvedExerciseId ? (
                    <div className="mt-4 flex justify-end border-t border-[var(--border)] pt-4">
                      <Link className="text-sm font-black underline underline-offset-4" href={`/exercises/${draft.approvedExerciseId}/edit`}>
                        Freigegebene Übung öffnen
                      </Link>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Notice({ children }: { readonly children: React.ReactNode }) {
  return <div className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm font-bold text-[var(--success-foreground)]">{children}</div>;
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
  return <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]">{message}</div>;
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
