import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OverviewLayout } from "@/components/overview-layout";
import { listTrainingSessions } from "@/server/training/training-session-repository";

export const dynamic = "force-dynamic";

const STATUS_LABELS = {
  draft: "Entwurf",
  ready: "Bereit",
  completed: "Abgeschlossen",
  archived: "Archiviert",
} as const;

interface PageProps {
  readonly searchParams: Promise<{ status?: string }>;
}

export default async function TrainingPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const archived = status === "archived";
  const allSessions = await listTrainingSessions(archived, 200);
  const sessions = archived
    ? allSessions.filter((session) => session.status === "archived")
    : allSessions;
  const totalMinutes = sessions.reduce((sum, session) => sum + session.totalDurationMinutes, 0);
  const draftCount = sessions.filter((session) => session.status === "draft").length;

  return (
    <AppShell
      title={archived ? "Training · Archiv" : "Training"}
      subtitle={archived
        ? "Archivierte Einheiten ansehen und bei Bedarf über die Detailseite wiederherstellen."
        : "Gespeicherte Einheiten aus Quick Create, lokalem Sportalgorithmus, AI Builder und Training Editor."}
      actions={archived ? undefined : (
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
            href="/training/templates"
          >
            Vorlagen
          </Link>
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
            href="/training/builder"
          >
            Training Builder
          </Link>
          <Link
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
            href="/quick-create"
          >
            + Quick Create
          </Link>
        </div>
      )}
    >
      <OverviewLayout storageKey="ocrcraft-training-view"><div className="space-y-6">
        {!archived ? (
          <section className="grid gap-3 lg:grid-cols-3">
            <Link
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--accent-strong)] hover:bg-[var(--surface-subtle)]"
              href="/training/builder"
            >
              <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Gezielte Planung</div>
              <h2 className="mt-1 text-lg font-black">Training Builder</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Wähle Ziele, Übungstypen, Muskeln, Gegenmuskeln, Formate, Ort, Intensität und Equipment. Plane lokal deterministisch oder lasse aus demselben freigegebenen Pool einen AI-Vorschlag erstellen.
              </p>
            </Link>
            <Link
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--accent-strong)] hover:bg-[var(--surface-subtle)]"
              href="/training/templates"
            >
              <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Wiederverwendbare Planung</div>
              <h2 className="mt-1 text-lg font-black">Trainingsvorlagen</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                24 kuratierte OCRCraft-Startvorlagen für Erwachsene, Kids und Youth mit Ausdauer, Koordination, Kraft, Mobility, Teamwork und Parcours.
              </p>
            </Link>
            <Link
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--accent-strong)] hover:bg-[var(--surface-subtle)]"
              href="/quick-create"
            >
              <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Schneller Einstieg</div>
              <h2 className="mt-1 text-lg font-black">Quick Create</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                In wenigen Schritten aus Gruppe, Schwerpunkt, Körperregionen und Format einen sicheren, bearbeitbaren Trainingsentwurf erzeugen.
              </p>
            </Link>
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label={archived ? "Archivierte Trainings" : "Gespeicherte Trainings"} value={sessions.length} />
          <Metric label="Offene Entwürfe" value={draftCount} />
          <Metric label="Geplante Minuten" value={totalMinutes} />
        </section>

        <div className="flex justify-end text-sm font-bold">
          {archived ? (
            <Link className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:bg-[var(--surface-subtle)]" href="/training">
              Aktive Trainings anzeigen
            </Link>
          ) : (
            <Link className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:bg-[var(--surface-subtle)]" href="/training?status=archived">
              Archiv anzeigen
            </Link>
          )}
        </div>

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
                      {sourceLabel(session.source)}
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

                <div className="mt-auto pt-5">
                  <div className="mb-3 text-xs font-semibold text-[var(--muted)]">
                    Erstellt {formatCreatedAt(session.createdAt)} · {session.locale.toUpperCase()}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
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
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-black">{archived ? "Archiv ist leer" : "Noch kein Training gespeichert"}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              {archived
                ? "Archivierte Einheiten erscheinen hier und können über ihre Detailseite wieder aktiviert werden."
                : "Nutze den Training Builder für gezielte lokale/AI-Planung oder Quick Create für einen schnellen deterministischen Entwurf."}
            </p>
            {!archived ? (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link
                  className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-black hover:bg-[var(--surface-subtle)]"
                  href="/training/builder"
                >
                  Training Builder öffnen
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
                  href="/quick-create"
                >
                  Quick Create öffnen
                </Link>
              </div>
            ) : null}
          </section>
        )}
      </div></OverviewLayout>
    </AppShell>
  );
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

function Metric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--muted)]">{label}</div>
    </div>
  );
}
