import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ExerciseFacetForm } from "@/components/exercises/exercise-facet-form";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { getExerciseById } from "@/server/exercises/exercise-repository";
import { getExerciseFacetEditorData } from "@/server/exercises/exercise-facet-repository";
import { setExerciseArchivedAction, updateExerciseAction } from "../../actions";
import { updateExerciseFacetsAction } from "../facet-actions";

interface PageProps {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{
    saved?: string;
    restored?: string;
    facetsSaved?: string;
    facetError?: string;
  }>;
}

export default async function EditExercisePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const status = await searchParams;
  const exercise = await getExerciseById(id);
  if (!exercise) notFound();

  const facets = await getExerciseFacetEditorData(exercise.id);
  const updateAction = updateExerciseAction.bind(null, exercise.id);
  const updateFacetsAction = updateExerciseFacetsAction.bind(null, exercise.id);
  const toggleArchivedAction = setExerciseArchivedAction.bind(null, exercise.id, !exercise.archived);

  return (
    <AppShell
      title={exercise.nameDe}
      subtitle={exercise.seedKey ? `Initialkatalog · ${exercise.seedKey}` : "Vereinsübung"}
      actions={(
        <Link
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold"
          href="/exercises"
        >
          Zur Bibliothek
        </Link>
      )}
    >
      <div className="space-y-5">
        {status.saved ? <Notice>Änderungen gespeichert. Der Suchindex wurde als „dirty“ markiert.</Notice> : null}
        {status.restored ? <Notice>Übung wiederhergestellt.</Notice> : null}
        {status.facetsSaved ? <Notice>Körperregionen, Bewegungsmuster, Tags und Equipment wurden gespeichert.</Notice> : null}
        {status.facetError === "invalid" ? <ErrorNotice>Die Facettenauswahl enthält ungültige Werte.</ErrorNotice> : null}
        {status.facetError === "save" ? <ErrorNotice>Die Facetten konnten nicht gespeichert werden.</ErrorNotice> : null}

        <ExerciseForm action={updateAction} exercise={exercise} submitLabel="Änderungen speichern" />

        <ExerciseFacetForm action={updateFacetsAction} data={facets} disabled={exercise.archived} />

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-black">{exercise.archived ? "Übung wiederherstellen" : "Übung archivieren"}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {exercise.archived
                  ? "Die Übung wird wieder in Bibliothek und Suchdokumente aufgenommen."
                  : "Archivieren entfernt die Übung aus aktiver Bibliothek und Suche, erhält sie aber für Referenzen."}
              </p>
            </div>
            <form action={toggleArchivedAction}>
              <button className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-black" type="submit">
                {exercise.archived ? "Wiederherstellen" : "Archivieren"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Notice({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--success)] bg-[var(--success-bg)] p-4 text-sm font-semibold text-[var(--success)]">
      {children}
    </div>
  );
}

function ErrorNotice({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm font-semibold text-[var(--danger)]">
      {children}
    </div>
  );
}
