import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { ExerciseClassificationEditor } from "@/components/exercises/exercise-classification-editor";
import {
  ExerciseDetailEditor,
  ExerciseLogisticsEditor,
} from "@/components/exercises/exercise-detail-editor";
import { ExerciseFacetForm } from "@/components/exercises/exercise-facet-form";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { ExerciseGuidanceListEditor } from "@/components/exercises/exercise-guidance-list-editor";
import { ExerciseOutdoorVariantEditor } from "@/components/exercises/exercise-outdoor-variant-editor";
import { ExerciseObstacleGuidanceEditor } from "@/components/exercises/exercise-obstacle-guidance-editor";
import { ExerciseProgressionEditor } from "@/components/exercises/exercise-progression-editor";
import { getExerciseClassificationEditorData } from "@/server/exercises/exercise-classification-repository";
import { getExerciseById, getExerciseProgressionRelations, listExerciseRelationOptions } from "@/server/exercises/exercise-repository";
import { getOptionalCurrentActor } from "@/server/auth/identity-service";
import { getExerciseFacetEditorData } from "@/server/exercises/exercise-facet-repository";
import { getExerciseOutdoorVariantEditorData } from "@/server/exercises/exercise-outdoor-variant-repository";
import { getObstacleGuidanceEditorData } from "@/server/obstacles/obstacle-editor-repository";
import { getTrainingExerciseGuidanceMap } from "@/server/training/training-exercise-guidance-repository";
import { hardDeleteExerciseAction, setExerciseArchivedAction, updateExerciseAction } from "../../actions";
import { updateExerciseClassificationAction } from "../classification-actions";
import {
  updateExerciseLogisticsAction,
  updateLocalizedExerciseDetailsAction,
} from "../detail-actions";
import { updateExerciseFacetsAction } from "../facet-actions";
import { updateExerciseGuidanceListsAction } from "../guidance-actions";
import { updateExerciseOutdoorVariantAction } from "../outdoor-variant-actions";
import { updateExerciseObstacleGuidanceAction } from "../obstacle-actions";
import { addExerciseProgressionRelationAction, deleteExerciseProgressionRelationAction } from "../progression-actions";
import { listExerciseMediaChoices } from "@/server/media/media-catalog-repository";
import { generateExerciseImageAction, selectExerciseImageAction } from "../../actions";
import { deleteExerciseMediaAction } from "../../actions";
import { ExerciseMediaManager } from "@/components/exercises/exercise-media-manager";
import { ConfirmPopoverForm } from "@/components/ui/confirm-popover-form";

interface PageProps {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{
    created?: string;
    saved?: string;
    restored?: string;
    classificationSaved?: string;
    classificationError?: string;
    facetsSaved?: string;
    facetError?: string;
    guidanceSaved?: string;
    guidanceError?: string;
    detailSaved?: string;
    detailError?: string;
    logisticsSaved?: string;
    logisticsError?: string;
    outdoorSaved?: string;
    outdoorError?: string;
    progressionSaved?: string;
    progressionError?: string;
    obstacleSaved?: string;
    obstacleError?: string;
    hardDeleteError?: string;
    mediaSaved?: string;
    mediaQueued?: string;
    mediaDeleted?: string;
    mediaError?: string;
    from?: string;
  }>;
}

export default async function EditExercisePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const status = await searchParams;
  const exercise = await getExerciseById(id);
  if (!exercise) notFound();
  const actor = await getOptionalCurrentActor();

  const [classification, facets, outdoorVariant, obstacleGuidance, guidanceDeMap, guidanceEnMap, progressionRelations, relationOptions, mediaChoices] = await Promise.all([
    getExerciseClassificationEditorData(exercise.id),
    getExerciseFacetEditorData(exercise.id),
    getExerciseOutdoorVariantEditorData(exercise.id),
    getObstacleGuidanceEditorData(exercise.id),
    getTrainingExerciseGuidanceMap([exercise.id], "de"),
    getTrainingExerciseGuidanceMap([exercise.id], "en"),
    getExerciseProgressionRelations(exercise.id),
    listExerciseRelationOptions(exercise.id),
    listExerciseMediaChoices(exercise.id),
  ]);
  if (!classification) notFound();

  const guidanceDe = guidanceDeMap[exercise.id];
  const guidanceEn = guidanceEnMap[exercise.id];
  const updateAction = updateExerciseAction.bind(null, exercise.id);
  const updateClassificationAction = updateExerciseClassificationAction.bind(null, exercise.id);
  const updateFacetsAction = updateExerciseFacetsAction.bind(null, exercise.id);
  const updateOutdoorVariantAction = updateExerciseOutdoorVariantAction.bind(null, exercise.id);
  const updateObstacleAction = updateExerciseObstacleGuidanceAction.bind(null, exercise.id);
  const updateGuidanceAction = updateExerciseGuidanceListsAction.bind(null, exercise.id);
  const updateDetailAction = updateLocalizedExerciseDetailsAction.bind(null, exercise.id);
  const updateLogisticsAction = updateExerciseLogisticsAction.bind(null, exercise.id);
  const toggleArchivedAction = setExerciseArchivedAction.bind(null, exercise.id, !exercise.archived);
  const hardDeleteAction = hardDeleteExerciseAction.bind(null, exercise.id);
  const addProgressionAction = addExerciseProgressionRelationAction.bind(null, exercise.id);
  const deleteProgressionAction = deleteExerciseProgressionRelationAction.bind(null, exercise.id);
  const selectImageAction = selectExerciseImageAction.bind(null, exercise.id);
  const deleteImageAction = deleteExerciseMediaAction.bind(null, exercise.id);
  const generateImageAction = generateExerciseImageAction.bind(null, exercise.id);
  const manualExercise = exercise.seedKey == null;
  const fullEditorOpen = manualExercise || Boolean(
    status.created
    || status.classificationError
    || status.classificationSaved
    || status.detailError
    || status.logisticsError
    || status.detailSaved
    || status.logisticsSaved
    || status.guidanceError
    || status.guidanceSaved
    || status.outdoorError
    || status.outdoorSaved
    || status.obstacleError
    || status.obstacleSaved,
  );

  return (
    <AppShell
      breadcrumbSection={status.from === "obstacles" || status.obstacleSaved || status.obstacleError || (exercise.category === "ocr-skill" && obstacleGuidance?.hasGuidance) ? "obstacles" : undefined}
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
            Grunddaten angelegt. Der vollständige Editor ist geöffnet: ergänze jetzt Trainingsziele, Zielgruppe, Muskeln/Gegenmuskeln, Bewegungsmuster, Equipment, Programmierung, Sicherheit sowie DE/EN-Ausführung und Coaching.
          </Notice>
        ) : null}
        {status.saved ? <Notice>Änderungen gespeichert. Der Suchindex wurde als „dirty“ markiert.</Notice> : null}
        {status.restored ? <Notice>Übung wiederhergestellt.</Notice> : null}
        {status.classificationSaved ? <Notice>Trainingsziele, Bewegungsprofil, Zielgruppe und Dosierungseinheiten wurden gespeichert.</Notice> : null}
        {status.facetsSaved ? <Notice>Körperregionen, Gegenmuskeln, Bewegungsmuster, Tags und Equipment wurden gespeichert.</Notice> : null}
        {status.guidanceSaved ? <Notice>{status.guidanceSaved === "en" ? "Englische" : "Deutsche"} Ausführung, Coaching-Cues und Fehlerkorrekturen wurden gespeichert.</Notice> : null}
        {status.detailSaved ? <Notice>{status.detailSaved === "en" ? "Englische" : "Deutsche"} Planungs-, Sicherheits- und Skalierungsdetails wurden gespeichert.</Notice> : null}
        {status.logisticsSaved ? <Notice>Schwierigkeit, Aufsicht und Stationslogistik wurden gespeichert.</Notice> : null}
        {status.outdoorSaved ? <Notice>Outdoor-Variante und alternatives Equipment wurden gespeichert und stehen der Outdoor-Trainingsplanung zur Verfügung.</Notice> : null}
        {status.progressionSaved ? <Notice>Progressionsbeziehung gespeichert.</Notice> : null}
        {status.obstacleSaved ? <Notice>Hindernis-Guidance, Stationskapazität und Sicherheitszone wurden gespeichert.</Notice> : null}
        {status.mediaSaved ? <Notice>Das Bild wurde als primäres Übungsbild ausgewählt.</Notice> : null}
        {status.mediaDeleted ? <Notice>Das zusätzliche Bild wurde entfernt.</Notice> : null}
        {status.mediaError ? <ErrorNotice>{status.mediaError === "primary" ? "Das Hauptbild kann nicht gelöscht werden. Wähle zuerst ein anderes Hauptbild." : "Das Bild konnte nicht entfernt werden."}</ErrorNotice> : null}
        {status.mediaQueued ? <Notice>Die Bildgenerierung wurde im Hintergrund eingeplant.</Notice> : null}
        {status.progressionError ? <ErrorNotice>Die Progressionsbeziehung ist ungültig oder konnte nicht gespeichert werden.</ErrorNotice> : null}
        {status.classificationError === "invalid" ? <ErrorNotice>Die Klassifikation ist unvollständig oder ungültig. Wähle mindestens ein Trainingsziel.</ErrorNotice> : null}
        {status.classificationError === "save" ? <ErrorNotice>Die Klassifikation konnte nicht gespeichert werden.</ErrorNotice> : null}
        {status.facetError === "invalid" ? <ErrorNotice>Die Facetten- oder Gegenmuskel-Auswahl enthält ungültige Werte.</ErrorNotice> : null}
        {status.facetError === "save" ? <ErrorNotice>Die Facetten konnten nicht gespeichert werden.</ErrorNotice> : null}
        {status.guidanceError === "invalid" ? <ErrorNotice>Die Coaching-Inhalte enthalten leere, unvollständige oder zu lange Einträge.</ErrorNotice> : null}
        {status.guidanceError === "save" ? <ErrorNotice>Die Coaching-Inhalte konnten nicht gespeichert werden.</ErrorNotice> : null}
        {status.detailError === "invalid" ? <ErrorNotice>Die Planungs- und Sicherheitsdetails enthalten ungültige oder zu lange Werte.</ErrorNotice> : null}
        {status.detailError === "save" ? <ErrorNotice>Die Planungs- und Sicherheitsdetails konnten nicht gespeichert werden.</ErrorNotice> : null}
        {status.logisticsError === "invalid" ? <ErrorNotice>Die Logistikwerte sind ungültig. Prüfe Zeiten, Kapazität und Pflichtfelder.</ErrorNotice> : null}
        {status.logisticsError === "save" ? <ErrorNotice>Die Logistikwerte konnten nicht gespeichert werden.</ErrorNotice> : null}
        {status.outdoorError === "save" ? <ErrorNotice>Die Outdoor-Variante konnte nicht gespeichert werden. Prüfe Texte und Equipment-Auswahl.</ErrorNotice> : null}
        {status.obstacleError === "invalid" ? <ErrorNotice>Die Hindernis-Guidance ist unvollständig oder enthält ungültige Werte.</ErrorNotice> : null}
        {status.obstacleError === "save" ? <ErrorNotice>Die Hindernis-Guidance konnte nicht gespeichert werden.</ErrorNotice> : null}
        {status.hardDeleteError === "confirmation" ? <ErrorNotice>Für das endgültige Löschen muss die Bestätigung exakt eingegeben werden.</ErrorNotice> : null}

        <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" open={Boolean(status.created || status.saved)}>
          <summary className="min-h-8 cursor-pointer font-bold">Stammdaten bearbeiten</summary>
          <ExerciseForm action={updateAction} exercise={exercise} submitLabel="Änderungen speichern" />
        </details>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">Medien</h2><p className="mt-1 text-sm text-[var(--muted)]">Wähle ein vorhandenes Bild als Standard oder plane eine neue KI-Sequenz ein.</p></div><div className="flex flex-wrap gap-2">{mediaChoices.length > 1 ? <ExerciseMediaManager choices={mediaChoices} deleteAction={deleteImageAction} exerciseName={exercise.nameDe} selectAction={selectImageAction} /> : null}<form action={generateImageAction}><button className="min-h-10 rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">Neues Bild per KI erzeugen</button></form></div></div>
          {mediaChoices.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{mediaChoices.map((media) => <form action={selectImageAction} className={`rounded-xl border p-3 ${media.isPrimary ? "border-[var(--accent)]" : "border-[var(--border)]"}`} key={media.id}><input name="assetId" type="hidden" value={media.id} />{media.url ? <ImageLightbox alt="Übungsbild" className="h-32 w-full rounded-lg bg-white object-contain" containerClassName="relative h-32" src={media.url} /> : <div className="grid h-32 place-items-center rounded-lg bg-[var(--surface-subtle)] text-xs text-[var(--muted)]">Kein Vorschaubild</div>}<div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="font-bold">{media.sourceType === "ai_generated" ? "KI" : "Extern"} · {media.reviewStatus}</span>{media.generationStatus === "generated" ? <button className="rounded-lg border border-[var(--border)] px-2 py-1 font-black" type="submit">{media.isPrimary ? "Ausgewählt" : "Auswählen"}</button> : <span className="text-[var(--muted)]">{media.generationStatus}</span>}</div></form>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">Noch kein Bild vorhanden.</p>}
        </section>

        <details open={fullEditorOpen} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <summary className="min-h-8 cursor-pointer font-bold">Trainingsziele, Zielgruppe & Bewegungsprofil</summary>
          <div className="mt-4">
            <ExerciseClassificationEditor action={updateClassificationAction} data={classification} disabled={exercise.archived} />
          </div>
        </details>

        <ExerciseFacetForm action={updateFacetsAction} data={facets} disabled={exercise.archived} />

        <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]" open={Boolean(status.progressionSaved || status.progressionError || progressionRelations.length)}>
          <summary className="min-h-8 cursor-pointer font-bold">Progressionen, Regressionen & Alternativen</summary>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--muted)]">Verknüpfe eine Übung mit einer leichteren, anspruchsvolleren oder gleichwertigen Variante. Die Beziehung wird separat von den Freitext-Leveln gespeichert.</p>
          <div className="mt-4"><ExerciseProgressionEditor addAction={addProgressionAction} deleteAction={deleteProgressionAction} disabled={exercise.archived} options={relationOptions} relations={progressionRelations} /></div>
        </details>

        {obstacleGuidance && (obstacleGuidance.hasGuidance || exercise.category === "ocr-skill" || exercise.category === "grip-rig") ? (
          <details
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
            id="obstacle-guidance"
            open={Boolean(status.obstacleSaved || status.obstacleError || obstacleGuidance.hasGuidance)}
          >
            <summary className="min-h-8 cursor-pointer font-bold">Hindernis-Guidance & Sicherheitszone</summary>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--muted)]">
              Pflege obstacle-spezifischen Aufbau, Annäherung, Ausführung, Ausstieg und Regression zweisprachig. Stationskapazität und Freizone gelten für beide Sprachen und werden mit der allgemeinen Übungslogistik synchronisiert.
            </p>
            <div className="mt-4">
              <ExerciseObstacleGuidanceEditor
                action={updateObstacleAction}
                data={obstacleGuidance}
                disabled={exercise.archived}
              />
            </div>
          </details>
        ) : null}

        <details
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
          id="outdoor-variant"
          open={Boolean(status.outdoorSaved || status.outdoorError || outdoorVariant.textDe || outdoorVariant.textEn)}
        >
          <summary className="min-h-8 cursor-pointer font-bold">Outdoor-Variante & alternatives Equipment</summary>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--muted)]">
            Für importierte Studioübungen kann der automatische Gym→Outdoor-Task eine portable Variante erzeugen. Hier bleibt sie vollständig trainerkontrolliert: Originalausführung und Studio-Equipment werden nicht verändert.
          </p>
          <ExerciseOutdoorVariantEditor
            action={updateOutdoorVariantAction}
            data={outdoorVariant}
            disabled={exercise.archived}
          />
        </details>

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
            <ConfirmPopoverForm action={toggleArchivedAction} description={exercise.archived ? "Die Übung wird wieder in Bibliothek und Suche aufgenommen." : "Die Übung wird aus der aktiven Bibliothek und Suche entfernt, bleibt aber für Referenzen erhalten."} title={exercise.archived ? "Übung wiederherstellen?" : "Übung archivieren?"} triggerClassName="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-black" triggerLabel={exercise.archived ? "Wiederherstellen" : "Archivieren"} />
          </div>
        </section>
        {exercise.archived && exercise.seedKey == null && actor?.role === "super_admin" ? (
          <section className="rounded-2xl border border-[var(--danger)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-black text-[var(--danger)]">Endgültig löschen</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Nur archivierte Vereinsübungen ohne Trainings-, Medien- oder Quellenreferenzen können dauerhaft gelöscht werden. Seeds sind geschützt.</p>
            <ConfirmPopoverForm action={hardDeleteAction} confirmLabel="Dauerhaft löschen" description="Diese Aktion kann nicht rückgängig gemacht werden. Es werden nur zulässige, archivierte Vereinsübungen akzeptiert." title="Übung endgültig löschen?" triggerClassName="min-h-10 rounded-lg bg-[var(--danger)] px-4 text-sm font-black text-white" triggerLabel="Dauerhaft löschen">
              <label className="grid w-full gap-1 text-xs font-bold"><span>Tippe ENDGÜLTIG LÖSCHEN</span><input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3" name="confirmation" placeholder="ENDGÜLTIG LÖSCHEN" required /></label>
            </ConfirmPopoverForm>
          </section>
        ) : null}
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
