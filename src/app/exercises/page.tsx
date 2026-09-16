import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  exerciseCategoryLabels,
  type ExerciseCategory,
} from "@/domain/exercise/model";
import {
  getExerciseCategoryCounts,
  listExercises,
} from "@/server/exercises/exercise-repository";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
  }>;
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category?.trim() || undefined;
  const archived = params.status === "archived";

  const [exercises, categoryCounts] = await Promise.all([
    listExercises({ query, category, archived }),
    getExerciseCategoryCounts(),
  ]);
  const total = categoryCounts.reduce((sum, item) => sum + item.count, 0);
  const runningCount = categoryCounts.find((item) => item.category === "running")?.count ?? 0;

  return (
    <AppShell
      title="Übungsbibliothek"
      subtitle="Breitensport, OCR und Laufen – vorbefüllt, suchbar und direkt administrierbar."
      actions={
        <Link
          className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]"
          href="/exercises/new"
        >
          + Neue Übung
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Aktive Übungen" value={total} />
          <Metric label="Laufübungen" value={runningCount} />
          <Metric label="Kategorien" value={categoryCounts.length} />
        </section>

        <form
          className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] lg:grid-cols-[1fr_220px_180px_auto]"
          method="get"
        >
          <label className="grid gap-1 text-sm font-bold">
            Suchen
            <input
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
              defaultValue={query}
              name="q"
              placeholder="z. B. Monkey Bars, Kniebeugen, Lauf ABC ..."
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Bereich
            <select
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
              defaultValue={category ?? ""}
              name="category"
            >
              <option value="">Alle Bereiche</option>
              {categoryCounts.map((item) => (
                <option key={item.category} value={item.category}>
                  {categoryLabel(item.category)} ({item.count})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Status
            <select
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
              defaultValue={archived ? "archived" : "active"}
              name="status"
            >
              <option value="active">Aktiv</option>
              <option value="archived">Archiviert</option>
            </select>
          </label>
          <button
            className="self-end rounded-xl bg-[var(--control-strong)] px-5 py-3 text-sm font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)]"
            type="submit"
          >
            Filtern
          </button>
        </form>

        <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <span>{exercises.length} Treffer in der aktuellen Ansicht</span>
          {archived ? (
            <Link className="font-bold text-[var(--foreground)]" href="/exercises">
              Aktive Übungen anzeigen
            </Link>
          ) : (
            <Link className="font-bold text-[var(--foreground)]" href="/exercises?status=archived">
              Archiv anzeigen
            </Link>
          )}
        </div>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => (
            <article
              className="flex min-h-64 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
              key={exercise.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {categoryLabel(exercise.category)}
                  </div>
                  <h2 className="mt-1 text-lg font-black">{exercise.name}</h2>
                </div>
                <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-bold">
                  {exercise.riskLevel}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                {exercise.summary || "Noch keine Kurzbeschreibung hinterlegt."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                {exercise.phase ? (
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1">
                    {exercise.phase}
                  </span>
                ) : null}
                {exercise.minAge ? (
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1">
                    ab {exercise.minAge}
                  </span>
                ) : null}
                {exercise.seedKey ? (
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1">
                    Initialkatalog
                  </span>
                ) : null}
                {exercise.equipment.slice(0, 3).map((item) => (
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1" key={item}>
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-5">
                <Link
                  className="inline-flex min-h-10 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-black hover:bg-[var(--surface-subtle)]"
                  href={`/exercises/${exercise.id}/edit`}
                >
                  {archived ? "Ansehen / Wiederherstellen" : "Bearbeiten"}
                </Link>
              </div>
            </article>
          ))}
        </section>

        {exercises.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
            Keine Übung passt zu diesem Filter.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function categoryLabel(category: string): string {
  return exerciseCategoryLabels[category as ExerciseCategory] ?? category;
}

function Metric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--muted)]">{label}</div>
    </div>
  );
}
