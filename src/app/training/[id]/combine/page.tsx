import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  getTrainingSessionById,
  listTrainingSessions,
} from "@/server/training/training-session-repository";
import { combineTrainingSessionsAction } from "./action";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ error?: string }>;
}

export default async function CombineTrainingPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [session, sessions] = await Promise.all([
    getTrainingSessionById(id),
    listTrainingSessions(false, 200),
  ]);
  if (!session) notFound();

  const candidates = sessions.filter((candidate) => candidate.id !== session.id);
  const action = combineTrainingSessionsAction.bind(null, session.id);

  return (
    <AppShell
      title="Trainings kombinieren"
      subtitle={`„${session.title}“ mit einer zweiten gespeicherten Einheit zu einem neuen Entwurf zusammenführen.`}
      actions={
        <Link
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
          href={`/training/${session.id}`}
        >
          ← Zurück zum Training
        </Link>
      }
    >
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="grid gap-3 sm:grid-cols-3">
          <InfoCard label="Basis" value={session.title} />
          <InfoCard label="Dauer" value={`${session.totalDurationMinutes} Min.`} />
          <InfoCard label="Übungen" value={String(session.itemCount)} />
        </section>

        {query.error ? (
          <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]">
            Die Trainings konnten nicht kombiniert werden. Bitte Auswahl prüfen und erneut versuchen.
          </div>
        ) : null}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="text-lg font-black">Zweites Training auswählen</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            Die Warm-up-, Hauptteil- und Cooldown-Übungen werden phasenweise zusammengeführt. Das neue Training wird immer als Entwurf gespeichert; die beiden Originale bleiben unverändert.
          </p>

          {candidates.length > 0 ? (
            <form action={action} className="mt-6 grid gap-5">
              <label className="grid gap-2 text-sm font-bold">
                Zweites Training
                <select
                  className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                  name="secondSessionId"
                  required
                >
                  <option value="">Training auswählen …</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.title} · {candidate.totalDurationMinutes} Min. · {candidate.itemCount} Übungen
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Titel des kombinierten Trainings
                <input
                  className="h-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                  maxLength={120}
                  name="title"
                  placeholder={`${session.title} + …`}
                />
                <span className="font-normal text-[var(--muted)]">
                  Optional. Ohne Angabe werden beide Trainingstitel kombiniert.
                </span>
              </label>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--muted)]">
                Gemeinsame Gruppen-Zuordnung wird nur übernommen, wenn beide Trainings derselben Vereinsgruppe zugeordnet sind. Die Dauer wird aus den tatsächlich zusammengeführten Trainingsitems neu berechnet.
              </div>

              <div className="flex justify-end">
                <button
                  className="min-h-11 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
                  type="submit"
                >
                  Als neuen Entwurf kombinieren
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
              Es gibt noch kein zweites aktives Training zum Kombinieren.
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function InfoCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</div>
      <div className="mt-1 truncate font-black" title={value}>{value}</div>
    </div>
  );
}
