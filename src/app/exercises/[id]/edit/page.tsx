import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  ExerciseDetailEditor,
  ExerciseLogisticsEditor,
} from "@/components/exercises/exercise-detail-editor";
import { ExerciseFacetForm } from "@/components/exercises/exercise-facet-form";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { ExerciseGuidanceListEditor } from "@/components/exercises/exercise-guidance-list-editor";
import { getExerciseById } from "@/server/exercises/exercise-repository";
import { getExerciseFacetEditorData } from "@/server/exercises/exercise-facet-repository";
import { getTrainingExerciseGuidanceMap } from "@/server/training/training-exercise-guidance-repository";
import { setExerciseArchivedAction, updateExerciseAction } from "../../actions";
import {
  updateExerciseLogisticsAction,
  updateLocalizedExerciseDetailsAction,
} from "../detail-actions";
import { updateExerciseFacetsAction } from "../facet-actions";
import { updateExerciseGuidanceListsAction } from "../guidance-actions";

interface PageProps {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{
    created?: string;
    saved?: string;
    restored?: string;
    facetsSaved?: string;
    facetError?: string;
    guidanceSaved?: string;
    guidanceError?: string;
    detailSaved?: string;
    detailError?: string;
    logisticsSaved?: string;
    logisticsError?: string;
  }>;
}

export default async function EditExercisePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const status = await searchParams;
  const exercise = await getExerciseById(id);
  if (!exercise) notFound();

  const [facets, guidanceDeMap, guidanceEnMap] = await Promise.all([
    getExerciseFacetEditorData(exercise.id),
    getTrainingExerciseGuidanceMap([exercise.id], "de"),
    getTrainingExerciseGuidanceMap([exercise.id], "en"),
  ]);
  const guidanceDe = guidanceDeMap[exercise.id];
  const guidanceEn = guidanceEnMap[exercise.id];
  const updateAction = updateExerciseAction.bind(null, exercise.id);
  const updateFacetsAction = updateExerciseFacetsAction.bind(null, exercise.id);
  const updateGuidanceAction = updateExerciseGuidanceListsAction.bind(null, exercise.id);
  const updateDetailAction = updateLocalizedExerciseDetailsAction.bind(null, exercise.id);
  const updateLogisticsAction = updateExerciseLogisticsAction.bind(null, exercise.id);
  const toggleArchivedAction = setExerciseArchivedAction.bind(null, exercise.id, !exercise.archived);
  const manualExercise = exercise.seedKey == null;
  const fullEditorOpen = manualExercise || Boolean(
    status.created
    || status.detailError
    || status.logisticsError
    || status.detailSaved
    || status.logisticsSaved
    || status.guidanceError
    || status.guidanceSaved,
  );

  return (
    <AppShell
      title={exercise.nameDe}
      subtitle={exercise.seedKey ? `Initialkatalog · ${exercise.seedKey}` : "Vereinsübung · vollständiger Editor"}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold"
            href={`/exercises/${exercise.id}`}
          >
            Detailansicht
          </Link>
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold"
            href="/exercises"
          >
            Zur Bibliothek
          </Link>
        </div>
      )}
    >
      <div className="space-y-5">
        {status.created ? (
          <Notice>
            Grunddaten angelegt. Der vollständige Editor ist geöffnet: ergänze jetzt Muskeln/Gegenmuskeln, Bewegungsmuster, Equipment, Programmierung, Sicherheit sowie DE/EN-Ausführung und Coaching.
          </Notice>
        ) : null}
        {status.saved ? <Notice>Änderungen gespeichert. Der Suchindex wurde als „dirty“ markiert.</Notice> : null}
        {status.restored ? <Notice>Übung wiederhergestellt.</Notice> : null}
        {status.facetsSaved ? <Notice>Körperregionen, Gegenmuskeln, Bewegungsmuster, Tags und Equipment wurden gespeichert.</Notice> : null}
        {status.guidanceSaved ? <Notice>{status.guidanceSaved === "en" ? "Englische" : "Deutsche"} Ausführung, Coaching-Cues und Fehlerkorrekturen wurden gespeichert.</Notice> : null}
        {status.detailSaved ? <Notice>{status.detailSaved === "en" ? "Englische" : "Deutsche"} Planungs-, Sicherheits- und Skalierungsdetails wurden gespeichert.</Notice> : null}
        {status.logisticsSaved ? <Notice>Schwierigkeit, Aufsicht und Stationslogistik wurden gespeichert.</Notice> : null}
        {status.facetError === "invalid" ? <ErrorNotice>Die Facetten- oder Gegenmuskel-Auswahl enthält ungültige Werte.</ErrorNotice> : null}
        {status.facetError === "save" ? <ErrorNotice>Die Facetten konnten nicht gespeichert werden.</ErrorNotice> : null}
        {status.guidanceError === "invalid" ? <ErrorNotice>Die Coaching-Inhalte enthalten leere, unvollständige oder zu lange Einträge.</ErrorNotice> : null}
        {status.guidanceError === "save" ? <ErrorNotice>Die Coaching-Inhalte konnten nicht gespeichert werden.</ErrorNotice> : null}
        {status.detailError === "invalid" ? <ErrorNotice>Die Planungs- und Sicherheitsdetails enthalten ungültige oder zu lange Werte.</ErrorNotice> : null}
        {status.detailError === "save" ? <ErrorNotice>Die Planungs- und Sicherheitsdetails konnten nicht gespeichert werden.</ErrorNotice> : null}
        {status.logisticsError === "invalid" ? <ErrorNotice>Die Logistikwerte sind ungültig. Prüfe Zeiten, Kapazität und Pflichtfelder.</ErrorNotice> : null}
        {status.logisticsError === "save" ? <ErrorNotice>Die Logistikwerte konnten nicht gespeichert werden.</ErrorNotice> : null}

        <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" open={Boolean(status.created || status.saved)}>
          <summary className="min-h-8 cursor-pointer font-bold">Stammdaten bearbeiten</summary>
          <ExerciseForm action={updateAction} exercise={exercise} submitLabel="Änderungen speichern" />
        </details>

        <ExerciseFacetForm action={updateFacetsAction} data={facets} disabled={exercise.archived} />

        <details open={fullEditorOpen} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <summary className="min-h-8 cursor-pointer font-bold">Programmierung, Sicherheit & Stationslogistik</summary>
          <div className="mb-5">
            <p className="mt-1 max-w-4xl text-sm leading-6 text-[var(--muted)]">
              Pflege Dosierung, Level 1–3, Zielgruppenvarianten und Sicherheitsinformationen sprachspezifisch. Schwierigkeit, Aufsicht, Aufbauzeit und Stationskapazität gelten für die Übung global und werden für beide Sprachen synchron gehalten.
            </p>
          </div>
          <ExerciseLogisticsEditor
            action={updateLogisticsAction}
            disabled={exercise.archived}
            guidance={guidanceDe ?? guidanceEn}
          />
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <ExerciseDetailEditor
              action={updateDetailAction}
              disabled={exercise.archived}
              guidance={guidanceDe}
              locale="de"
            />
            <ExerciseDetailEditor
              action={updateDetailAction}
              disabled={exercise.archived}
              guidance={guidanceEn}
              locale="en"
            />
          </div>
        </details>

        <details open={fullEditorOpen} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <summary className="min-h-8 cursor-pointer font-bold">Strukturierte Ausführung & Coaching</summary>
          <div className="mb-5">
            <p className="mt-1 max-w-4xl text-sm leading-6 text-[var(--muted)]">
              Pflege die Reihenfolge der Ausführungsschritte, kurze Trainer-Cues sowie typische Fehler mit konkreter Korrektur getrennt für Deutsch und Englisch. Diese Inhalte werden in der Übungsdetailansicht und direkt in Trainings verwendet.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ExerciseGuidanceListEditor
              action={updateGuidanceAction}
              coachingCues={guidanceDe?.coachingCues ?? []}
              commonMistakes={guidanceDe?.commonMistakes ?? []}
              disabled={exercise.archived}
              executionSteps={guidanceDe?.executionSteps ?? []}
              locale="de"
            />
            <ExerciseGuidanceListEditor
              action={updateGuidanceAction}
              coachingCues={guidanceEn?.coachingCues ?? []}
              commonMistakes={guidanceEn?.commonMistakes ?? []}
              disabled={exercise.archived}
              executionSteps={guidanceEn?.executionSteps ?? []}
              locale="en"
            />
          </div>
        </details>

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
