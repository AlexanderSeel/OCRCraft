import { OverviewLayout } from "@/components/overview-layout";
import { CatalogSummaryStrip } from "@/components/catalog/catalog-workspace";
import { CatalogPagination } from "@/components/catalog/catalog-controls";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MuscleMap } from "@/components/body/muscle-map";
import { FilterSidePanel } from "@/components/layout/filter-side-panel";
import { ExerciseFilterPopover } from "@/components/exercises/exercise-filter-popover";
import { ExerciseImagePreview } from "@/components/exercises/exercise-image-preview";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { buttonClass, formControlClass } from "@/components/ui/form";
import { expandBodyRegionIds } from "@/domain/body-regions";
import {
  exerciseCategoryLabels,
  type ExerciseCategory,
} from "@/domain/exercise/model";
import {
  getExerciseBodyRegionMap,
  listBodyRegionOptions,
  listExerciseIdsForTags,
  listTagOptions,
  listExerciseIdsForBodyRegions,
} from "@/server/exercises/exercise-facet-repository";
import { countExercises, getExerciseCategoryCounts } from "@/server/exercises/exercise-repository";
import { searchExercises } from "@/server/search/exercise-search-service";
import { getOptionalCurrentActor } from "@/server/auth/identity-service";
import { getExerciseLibraryPersonalization } from "@/server/exercises/exercise-personalization-repository";
import { setExerciseFavoriteAction } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    muscle?: string | string[];
    page?: string;
    size?: string;
    facet?: string | string[];
    collection?: string;
  }>;
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category?.trim() || undefined;
  const archived = params.status === "archived";
  const selectedMuscles = parameterList(params.muscle);
  const selectedFacets = parameterList(params.facet);
  const collection = params.collection === "favorites" || params.collection === "recent" ? params.collection : "";
  const actor = await getOptionalCurrentActor();
  const personalization = actor
    ? await getExerciseLibraryPersonalization(actor.id)
    : { favoriteExerciseIds: [] as readonly string[], recentExercises: [] as readonly { exerciseId: string; useCount: number; lastUsedAt: string }[] };
  const favoriteIds = new Set(personalization.favoriteExerciseIds);
  const recentById = new Map(personalization.recentExercises.map((item) => [item.exerciseId,item]));
  const personalFilterIds = collection === "favorites"
    ? favoriteIds
    : collection === "recent"
      ? new Set(personalization.recentExercises.map((item) => item.exerciseId))
      : null;
  const requestedSize = Number.parseInt(params.size ?? "80", 10) || 80;
  const pageSize = [20, 40, 80, 120].includes(requestedSize) ? requestedSize : 80;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [searchResult, categoryCounts, baseFilteredTotal, bodyRegionOptions, tagOptions] = await Promise.all([
    searchExercises({ query, category, archived, limit: selectedMuscles.length || selectedFacets.length || personalFilterIds ? 200 : pageSize + 1, offset: selectedMuscles.length || selectedFacets.length || personalFilterIds ? 0 : (page - 1) * pageSize }),
    getExerciseCategoryCounts(),
    countExercises({ query, category, archived }),
    listBodyRegionOptions(),
    listTagOptions(),
  ]);

  const matchingMuscleIds = selectedMuscles.length > 0
    ? new Set(await listExerciseIdsForBodyRegions(expandBodyRegionIds(selectedMuscles)))
    : null;
  const matchingFacetIds = selectedFacets.length > 0 ? new Set(await listExerciseIdsForTags(selectedFacets)) : null;
  const matchingIds = matchingMuscleIds || matchingFacetIds || personalFilterIds
    ? new Set(searchResult.filter((exercise) =>
        (!matchingMuscleIds || matchingMuscleIds.has(exercise.id))
        && (!matchingFacetIds || matchingFacetIds.has(exercise.id))
        && (!personalFilterIds || personalFilterIds.has(exercise.id))
      ).map((exercise) => exercise.id))
    : null;
  const filteredResults = matchingIds ? searchResult.filter((exercise) => matchingIds.has(exercise.id)) : null;
  const filteredTotal = filteredResults ? filteredResults.length : baseFilteredTotal;
  const pagedResults = (filteredResults ?? searchResult).slice((matchingIds ? page - 1 : 0) * pageSize, (matchingIds ? page : 1) * pageSize);
  const exercises = pagedResults;
  const bodyRegionMap = await getExerciseBodyRegionMap(exercises.map((exercise) => exercise.id));

  const runningCount = categoryCounts.find((item) => item.category === "running")?.count ?? 0;

  return (
    <AppShell
      title="Übungsbibliothek"
      subtitle="Breitensport, OCR und Laufen – vorbefüllt, suchbar und direkt administrierbar."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className={buttonClass("secondary", "px-4")} href="/obstacles">
            Hindernisse
          </Link>
          <Link className={buttonClass("secondary", "px-4")} href="/media">
            Medien
          </Link>
          <Link className={buttonClass("secondary", "px-4")} href="/exercises/ai-drafts">
            AI-Entwürfe
          </Link>
          <Link
            className={buttonClass("accent", "px-4")}
            href="/exercises/new"
          >
            + Neue Übung
          </Link>
        </div>
      }
    >
      <OverviewLayout storageKey="ocrcraft-exercise-view"><div className="space-y-6">
        <div className="catalog-workspace grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <FilterSidePanel title="Übungsfilter">
        <form
          className="grid min-w-0 gap-3"
          method="get"
        >
          <label className="grid min-w-0 gap-1 text-sm font-bold">
            Suchen
            <input
              className={`${formControlClass} min-w-0`}
              defaultValue={query}
              name="q"
              placeholder="z. B. Monkey Bars, Kniebeugen, Lauf ABC ..."
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Bereich
            <select
              className={`${formControlClass} min-w-0`}
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
              className={`${formControlClass} min-w-0`}
              defaultValue={archived ? "archived" : "active"}
              name="status"
            >
              <option value="active">Aktiv</option>
              <option value="archived">Archiviert</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Sammlung
            <select className={`${formControlClass} min-w-0`} defaultValue={collection} name="collection">
              <option value="">Alle Übungen</option>
              <option value="favorites">Meine Favoriten ({favoriteIds.size})</option>
              <option value="recent">Zuletzt verwendet ({recentById.size})</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Pro Seite
            <select className={`${formControlClass} min-w-0`} defaultValue={String(pageSize)} name="size">
              {[20, 40, 80, 120].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <button
            className={buttonClass("primary", "self-end px-5")}
            type="submit"
          >
            Filtern
          </button>

          <div className="relative">
            <ExerciseFilterPopover count={selectedMuscles.length} title="Muskelgruppen">
              <MuscleMap
                compact
                key={selectedMuscles.join(",") || "none"}
                description="Wähle eine oder mehrere Regionen. Feine Muskelangaben berücksichtigen kompatible ältere Grobzuordnungen, ohne bestehende Übungen umzuschreiben."
                fieldName="muscle"
                mode="select"
                options={bodyRegionOptions}
                title="Muskel- & Körperregionen"
                value={selectedMuscles.map((id) => ({ id }))}
              />
            </ExerciseFilterPopover>
            {selectedMuscles.length ? <div className="mt-2 flex flex-wrap gap-2">{selectedMuscles.map((id) => { const label = bodyRegionOptions.find((option) => option.id === id)?.labelDe ?? id; return <Link className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-bold" href={removeMuscleHref(params, id)} key={id}>{label}<span aria-hidden="true">×</span><span className="sr-only">{label} entfernen</span></Link>; })}</div> : null}
          </div>
          <div className="relative">
            <ExerciseFilterPopover count={selectedFacets.length} title="Trainingsfacetten">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tagOptions.map((tag) => <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-2 py-2 text-xs font-bold" key={tag.id}><input defaultChecked={selectedFacets.includes(tag.id)} name="facet" type="checkbox" value={tag.id} />{tag.labelDe}</label>)}
              </div>
            </ExerciseFilterPopover>
            {selectedFacets.length ? <div className="mt-2 flex flex-wrap gap-2">{selectedFacets.map((id) => { const label = tagOptions.find((option) => option.id === id)?.labelDe ?? id; return <Link className="inline-flex items-center gap-1 rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-bold" href={removeFacetHref(params, id)} key={id}>{label}<span aria-hidden="true">×</span><span className="sr-only">{label} entfernen</span></Link>; })}</div> : null}
          </div>
        </form>
        </FilterSidePanel>
        <div className="min-w-0 space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <CatalogSummaryStrip items={[
            { label: "Übungen", value: filteredTotal === 0 ? "0" : `${Math.min((page - 1) * pageSize + 1, filteredTotal)}–${Math.min(page * pageSize, filteredTotal)} von ${filteredTotal}` },
            { label: "Laufen", value: runningCount },
            { label: "Kategorien", value: categoryCounts.length },
            { label: "Favoriten", value: `★ ${favoriteIds.size}` },
            { label: "Zuletzt verwendet", value: recentById.size },
          ]} />
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

        <section className="exercise-results grid gap-3">
          {exercises.map((exercise, index) => {
            const affectedMuscles = bodyRegionMap[exercise.id] ?? [];
            return (
            <Card
              as="article"
              className="exercise-card flex flex-col overflow-hidden"
              key={exercise.id}
            >
              {exercise.imageUrl ? (
                <div className="exercise-card-image relative w-full overflow-hidden bg-[var(--surface-subtle)]">
                  <ExerciseImagePreview alt={`Übungsillustration: ${exercise.name}`} key={exercise.imageUrl} priority={index === 0} src={exercise.imageUrl} />
                  {exercise.imageReviewStatus === "pending" ? (
                    <span className="absolute left-3 top-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 px-2.5 py-1 text-xs font-bold text-[var(--foreground)] shadow-sm">
                      KI-Bild · noch zu prüfen
                    </span>
                  ) : null}
                  {exercise.imageLicenseLabel ? (
                    <span className="absolute right-3 top-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 px-2.5 py-1 text-xs font-bold text-[var(--muted)] shadow-sm">
                      {exercise.imageLicenseLabel}
                    </span>
                  ) : null}
                  {exercise.imageFormat === "exercise_sequence" ? (
                    <span className="absolute bottom-3 left-3 rounded-lg bg-[var(--surface)]/95 px-2.5 py-1 text-xs font-bold text-[var(--foreground)] shadow-sm">
                      Schrittfolge{exercise.sequenceStepCount ? ` · ${exercise.sequenceStepCount} Schritte` : ""}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="exercise-card-image flex w-full items-center justify-center bg-[var(--surface-subtle)] text-sm font-semibold text-[var(--muted)]">
                  Noch kein Bild verfügbar
                </div>
              )}
              <div className="exercise-card-content flex min-w-0 flex-1 flex-col p-3">
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
                <p className="exercise-card-summary mt-2 line-clamp-3 text-sm leading-5 text-[var(--muted)]">
                  {exercise.summary || "Noch keine Kurzbeschreibung hinterlegt."}
                </p>
                {affectedMuscles.length > 0 ? (
                  <div className="exercise-card-muscles mt-3 flex items-center gap-3 rounded-xl bg-[var(--surface-subtle)] p-2">
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
                <div className="exercise-card-tags mt-3 flex flex-wrap gap-2 text-xs font-bold">
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
                  {favoriteIds.has(exercise.id) ? (
                    <span className="rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1">★ Favorit</span>
                  ) : null}
                  {recentById.has(exercise.id) ? (
                    <span className="rounded-full border border-[var(--border)] px-2.5 py-1">
                      Zuletzt genutzt · {recentById.get(exercise.id)?.useCount}×
                    </span>
                  ) : null}
                  {exercise.equipment.slice(0, 3).map((item) => (
                    <span className="rounded-full border border-[var(--border)] px-2.5 py-1" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
                <div className="exercise-card-actions mt-auto flex flex-wrap gap-2 pt-3">
                  <form action={setExerciseFavoriteAction}>
                    <input name="exerciseId" type="hidden" value={exercise.id} />
                    <input name="favorite" type="hidden" value={favoriteIds.has(exercise.id) ? "0" : "1"} />
                    <button
                      aria-label={favoriteIds.has(exercise.id) ? `${exercise.name} aus Favoriten entfernen` : `${exercise.name} zu Favoriten hinzufügen`}
                      className={buttonClass("secondary", "px-3")}
                      type="submit"
                    >
                      {favoriteIds.has(exercise.id) ? "★ Favorit" : "☆ Favorit"}
                    </button>
                  </form>
                  <Link
                    className={buttonClass("primary", "px-4")}
                    href={`/exercises/${exercise.id}`}
                  >
                    Details
                  </Link>
                  <Link
                    className={buttonClass("secondary", "px-4")}
                    href={`/exercises/${exercise.id}/edit`}
                  >
                    {archived ? "Ansehen / Wiederherstellen" : "Bearbeiten"}
                  </Link>
                </div>
              </div>
            </Card>
            );
          })}
        </section>
        <CatalogPagination href={(nextPage) => pageHref(nextPage, params)} label="Übungen" page={page} totalPages={Math.max(1, Math.ceil(filteredTotal / pageSize))} />

        {exercises.length === 0 ? (
          <EmptyState title="Keine Übungen gefunden">Keine Übung passt zu diesem Filter.</EmptyState>
        ) : null}
        </div>
        </div>
      </div></OverviewLayout>
    </AppShell>
  );
}

function parameterList(value: string | string[] | undefined): readonly string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

type ExerciseSearchParams = {
  readonly q?: string;
  readonly category?: string;
  readonly status?: string;
  readonly muscle?: string | string[];
  readonly size?: string;
  readonly page?: string;
  readonly facet?: string | string[];
  readonly collection?: string;
};

function pageHref(page: number, params: ExerciseSearchParams): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.status) query.set("status", params.status);
  if (params.size) query.set("size", params.size);
  if (params.collection) query.set("collection", params.collection);
  for (const muscle of parameterList(params.muscle)) query.append("muscle", muscle);
  for (const facet of parameterList(params.facet)) query.append("facet", facet);
  query.set("page", String(page));
  return `/exercises?${query.toString()}`;
}

function removeFacetHref(params: ExerciseSearchParams, facet: string): string {
  return pageHref(1, { ...params, facet: parameterList(params.facet).filter((item) => item !== facet), page: undefined });
}

function removeMuscleHref(params: ExerciseSearchParams, muscle: string): string {
  const remaining = parameterList(params.muscle).filter((item) => item !== muscle);
  return pageHref(1, { ...params, muscle: remaining, page: undefined });
}

function categoryLabel(category: string): string {
  return exerciseCategoryLabels[category as ExerciseCategory] ?? category;
}
