import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TRAINING_PHASE_LABELS } from "@/domain/training/model";
import { getTrainingSessionById } from "@/server/training/training-session-repository";
import { updateTrainingSessionMetadataAction } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function TrainingDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const session = await getTrainingSessionById(id);
  if (!session) notFound();

  const updateAction = updateTrainingSessionMetadataAction.bind(null, session.id);

  return (
    <AppShell
      title={session.title}
      subtitle={`${session.totalDurationMinutes} Minuten · ${session.itemCount} Übungen · ${session.locale.toUpperCase()}`}
      actions={
        <Link
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
          href="/training"
        >
          ← Trainings
        </Link>
      }
    >
      <div className="space-y-6">
        {query.saved === "1" ? (
          <div className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm font-bold text-[var(--success-foreground)]">
            Training wurde aktualisiert.
          </div>
        ) : null}
        {query.error ? (
          <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]">
            Titel oder Status konnten nicht gespeichert werden. Bitte Eingaben prüfen.
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-3">
          <InfoCard label="Status" value={statusLabel(session.status)} />
          <InfoCard label="Quelle" value={session.source === "manual" ? "Quick Create" : session.source} />
          <InfoCard label="Dauer" value={`${session.totalDurationMinutes} Min.`} />
        </section>

        <form
          action={updateAction}
          className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] md:grid-cols-[minmax(0,1fr)_220px_auto]"
        >
          <label className="grid gap-2 text-sm font-bold">
            Trainingstitel
            <input
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
              defaultValue={session.title}
              maxLength={120}
              name="title"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Status
            <select
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
              defaultValue={session.status}
              name="status"
            >
              <option value="draft">Entwurf</option>
              <option value="ready">Bereit</option>
              <option value="completed">Abgeschlossen</option>
              <option value="archived">Archiviert</option>
            </select>
          </label>
          <button
            className="min-h-11 self-end rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)]"
            type="submit"
          >
            Metadaten speichern
          </button>
        </form>

        <section className="space-y-4">
          {session.phases.map((phase) => (
            <article
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
              key={phase.id}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {TRAINING_PHASE_LABELS[phase.kind]}
                  </div>
                  <h2 className="mt-1 text-xl font-black">{phase.title}</h2>
                </div>
                <div className="text-sm font-bold text-[var(--muted)]">
                  {phase.items.reduce((sum, item) => sum + item.durationMinutes, 0)} Min.
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {phase.items.map((item, index) => (
                  <div
                    className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:grid-cols-[42px_minmax(0,1fr)_auto]"
                    key={item.id}
                  >
                    <div className="grid size-9 place-items-center rounded-full bg-[var(--surface)] text-sm font-black ring-1 ring-[var(--border)]">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-black">{item.exerciseName}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs font-bold text-[var(--muted)]">
                        {item.format ? <span>{item.format}</span> : null}
                        {item.levelLabel ? <span>· {item.levelLabel}</span> : null}
                      </div>
                      {item.instructions ? (
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--muted)]">
                          {item.instructions}
                        </p>
                      ) : null}
                    </div>
                    <div className="font-black">{item.durationMinutes} Min.</div>
                  </div>
                ))}

                {phase.items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                    Diese Phase enthält noch keine Übung.
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        {session.notes ? (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm leading-6 text-[var(--muted)] shadow-[var(--shadow-card)]">
            <div className="mb-1 font-black text-[var(--foreground)]">Notiz</div>
            {session.notes}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function statusLabel(status: string): string {
  if (status === "draft") return "Entwurf";
  if (status === "ready") return "Bereit";
  if (status === "completed") return "Abgeschlossen";
  if (status === "archived") return "Archiviert";
  return status;
}

function InfoCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</div>
      <div className="mt-1 font-black">{value}</div>
    </div>
  );
}
