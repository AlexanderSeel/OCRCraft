import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { MuscleMap } from "@/components/body/muscle-map";
import { expandBodyRegionIds } from "@/domain/body-regions";
import {
  exerciseCategoryLabels,
  type ExerciseCategory,
} from "@/domain/exercise/model";
import {
  getExerciseBodyRegionMap,
  listBodyRegionOptions,
  listExerciseIdsForBodyRegions,
} from "@/server/exercises/exercise-facet-repository";
import { getExerciseCategoryCounts } from "@/server/exercises/exercise-repository";
import { searchExercises } from "@/server/search/exercise-search-service";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    muscle?: string | string[];
  }>;
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category?.trim() || undefined;
  const archived = params.status === "archived";
  const selectedMuscles = parameterList(params.muscle);

  const [searchResult, categoryCounts, bodyRegionOptions] = await Promise.all([
    searchExercises({ query, category, archived, limit: selectedMuscles.length > 0 ? 200 : 80 }),
    getExerciseCategoryCounts(),
    listBodyRegionOptions(),
  ]);

  const matchingMuscleIds = selectedMuscles.length > 0
    ? new Set(await listExerciseIdsForBodyRegions(expandBodyRegionIds(selectedMuscles)))
    : null;
  const exercises = matchingMuscleIds
    ? searchResult.filter((exercise) => matchingMuscleIds.has(exercise.id))
    : searchResult;
  const bodyRegionMap = await getExerciseBodyRegionMap(exercises.map((exercise) => exercise.id));

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

          <details
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 lg:col-span-4"
            open={selectedMuscles.length > 0}
          >
            <summary className="cursor-pointer text-sm font-black">
              Nach Muskelgruppen filtern{selectedMuscles.length > 0 ? ` · ${selectedMuscles.length} gewählt` : ""}
            </summary>
            <div className="mt-4 w-full xl:[&>div>div:nth-child(2)]:grid xl:[&>div>div:nth-child(2)]:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] xl:[&>div>div:nth-child(2)]:items-start xl:[&>div>div:nth-child(2)]:gap-5 xl:[&>div>div:nth-child(2)>div:first-child]:max-w-none xl:[&>div>div:nth-child(2)>details]:mt-0">
              <MuscleMap
                key={selectedMuscles.join(",") || "none"}
                description="Wähle eine oder mehrere Regionen. Feine Muskelangaben berücksichtigen kompatible ältere Grobzuordnungen, ohne bestehende Übungen umzuschreiben."
                fieldName="muscle"
                mode="select"
                options={bodyRegionOptions}
                title="Muskel- & Körperregionen"
                value={selectedMuscles.map((id) => ({ id }))}
              />
            </div>
          </details>
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
          {exercises.map((exercise, index) => {
            const affectedMuscles = bodyRegionMap[exercise.id] ?? [];
            return (
            <article
              className="flex min-h-64 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
              key={exercise.id}
            >
              {exercise.imageUrl ? (
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-[var(--surface-subtle)]">
                  <Image
                    alt={`Übungsillustration: ${exercise.name}`}
                    className="object-cover"
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    src={exercise.imageUrl}
                    unoptimized
                  />
                  {exercise.imageReviewStatus === "pending" ? (
                    <span className="absolute left-3 top-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 px-2.5 py-1 text-xs font-bold text-[var(--foreground)] shadow-sm">
                      KI-Bild · noch zu prüfen
                    </span>
                  ) : null}
                  {exercise.imageFormat === "exercise_sequence" ? (
                    <span className="absolute bottom-3 left-3 rounded-lg bg-[var(--surface)]/95 px-2.5 py-1 text-xs font-bold text-[var(--foreground)] shadow-sm">
                      Schrittfolge{exercise.sequenceStepCount ? ` · ${exercise.sequenceStepCount} Schritte` : ""}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex aspect-[3/2] w-full items-center justify-center bg-[var(--surface-subtle)] text-sm font-semibold text-[var(--muted)]">
                  Noch kein Bild verfügbar
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
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
                {affectedMuscles.length > 0 ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-[var(--surface-subtle)] p-2">
                    <div className="w-20 shrink-0" title="Beanspruchte Muskel- und Körperregionen">
                      <MuscleMap
                        compact
                        mode="display"
                        options={bodyRegionOptions}
                        value={affectedMuscles}
                      />
                    </div>
                    <p className="text-xs font-semibold leading-5 text-[var(--muted)]">
                      {affectedMuscles.map((region) =>
                        bodyRegionOptions.find((option) => option.id === region.id)?.labelDe ?? region.id
                      ).join(" · ")}
                    </p>
                  </div>
                ) : null}
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
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link
                    className="inline-flex min-h-10 items-center rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)]"
                    href={`/exercises/${exercise.id}`}
                  >
                    Details
                  </Link>
                  <Link
                    className="inline-flex min-h-10 items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-black hover:bg-[var(--surface-subtle)]"
                    href={`/exercises/${exercise.id}/edit`}
                  >
                    {archived ? "Ansehen / Wiederherstellen" : "Bearbeiten"}
                  </Link>
                </div>
              </div>
            </article>
            );
          })}
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

function parameterList(value: string | string[] | undefined): readonly string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
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
