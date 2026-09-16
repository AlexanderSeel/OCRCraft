import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { listTrainingSessions } from "@/server/training/training-session-repository";

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  draft: "Entwurf",
  ready: "Bereit",
  completed: "Abgeschlossen",
  archived: "Archiviert",
} as const;

export default async function TrainingPage() {
  const sessions = await listTrainingSessions(false, 100);
  const totalMinutes = sessions.reduce((sum, session) => sum + session.totalDurationMinutes, 0);
  const draftCount = sessions.filter((session) => session.status === "draft").length;

  return (
    <AppShell
      title="Training"
      subtitle="Gespeicherte Einheiten aus Quick Create und später dem manuellen Training Editor."
      actions={
        <Link
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
          href="/quick-create"
        >
          + Quick Create
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Gespeicherte Trainings" value={sessions.length} />
          <Metric label="Offene Entwürfe" value={draftCount} />
          <Metric label="Geplante Minuten" value={totalMinutes} />
        </section>

        {sessions.length > 0 ? (
          <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <article
                className="flex min-h-56 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
                key={session.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {session.source === "manual" ? "Quick Create" : session.source}
                    </div>
                    <h2 className="mt-1 break-words text-lg font-black">{session.title}</h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-bold">
                    {STATUS_LABELS[session.status]}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
                    <dt className="text-xs font-bold text-[var(--muted)]">Dauer</dt>
                    <dd className="mt-1 font-black">{session.totalDurationMinutes} Min.</dd>
                  </div>
                  <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
                    <dt className="text-xs font-bold text-[var(--muted)]">Übungen</dt>
                    <dd className="mt-1 font-black">{session.itemCount}</dd>
                  </div>
                </dl>

                <div className="mt-auto pt-5 text-xs font-semibold text-[var(--muted)]">
                  Erstellt {formatCreatedAt(session.createdAt)} · {session.locale.toUpperCase()}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-black">Noch kein Training gespeichert</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Erstelle mit Quick Create einen deterministischen Entwurf aus der realen Übungsdatenbank und speichere ihn anschließend hier als bearbeitbares Training.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
              href="/quick-create"
            >
              Erstes Training erstellen
            </Link>
          </section>
        )}
      </div>
    </AppShell>
  );
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

function Metric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--muted)]">{label}</div>
    </div>
  );
}
