import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Disclosure } from "@/components/ui/disclosure";
import { AddTrainingItemForm } from "@/components/training/add-training-item-form";
import { PersistedMainPartProgrammingForm } from "@/components/training/persisted-main-part-programming-form";
import { ReplaceTrainingItemForm } from "@/components/training/replace-training-item-form";
import { TrainingItemAlternatives } from "@/components/training/training-item-alternatives";
import { TrainingItemGuidance } from "@/components/training/training-item-guidance";
import { TrainingItemReorderZone } from "@/components/training/training-item-reorder-zone";
import { TRAINING_PHASE_LABELS } from "@/domain/training/model";
import { getTrainingExerciseGuidanceMap } from "@/server/training/training-exercise-guidance-repository";
import { getLatestTrainingGeneration } from "@/server/training/training-generation-repository";
import { getTrainingSessionById } from "@/server/training/training-session-repository";
import {
  deleteTrainingItemAction,
  moveTrainingItemAction,
  updateTrainingItemAction,
  updateTrainingSessionMetadataAction,
} from "./actions";
import { duplicateTrainingSessionAction } from "./duplicate-action";
import { updateTrainingOrganizationAction } from "./organization-action";
import { reorderTrainingItemsAction } from "./reorder-action";
import { createTrainingVersionAction, restoreTrainingVersionAction } from "./version-actions";
import { listTrainingVersions } from "@/server/training/training-version-service";
import { createClubTrainingTemplateAction } from "../templates/actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{
    saved?: string;
    error?: string;
    alternativeItem?: string;
    alternativeMode?: string;
  }>;
}

export default async function TrainingDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const session = await getTrainingSessionById(id);
  if (!session) notFound();

  const exerciseIds = session.phases.flatMap((phase) =>
    phase.items.flatMap((item) => item.exerciseId ? [item.exerciseId] : []),
  );
  const [guidanceByExerciseId, generation] = await Promise.all([
    getTrainingExerciseGuidanceMap(exerciseIds, session.locale),
    getLatestTrainingGeneration(session.id),
  ]);
  const versions = await listTrainingVersions(session.id);
  const updateMetadataAction = updateTrainingSessionMetadataAction.bind(null, session.id);
  const duplicateAction = duplicateTrainingSessionAction.bind(null, session.id);
  const editable = session.status !== "archived";
  const mainPartCount = Math.max(
    1,
    ...session.phases
      .filter((phase) => phase.kind === "main")
      .flatMap((phase) => phase.items.map((item) => item.mainPartIndex ?? 1)),
  );

  return (
    <AppShell
      title={session.title}
      subtitle={`${session.totalDurationMinutes} Minuten · ${session.itemCount} Übungen · ${session.locale.toUpperCase()}`}
      actions={
        <div className="flex flex-wrap gap-2">
          {editable && generation ? (
            <Link
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
              href={`/training/builder?source=${session.id}`}
            >
              Im Builder anpassen
            </Link>
          ) : null}
          {editable ? (
            <Link
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
              href={`/training/${session.id}/combine`}
            >
              Kombinieren
            </Link>
          ) : null}
          <form action={duplicateAction}>
            <button
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
              type="submit"
            >
              Training duplizieren
            </button>
          </form>
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
            href="/training"
          >
            ← Trainings
          </Link>
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
            href={`/training/${session.id}/trainer`}
            target="_blank"
          >
            Readonly teilen
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {query.saved ? (
          <div className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm font-bold text-[var(--success-foreground)]">
            {savedMessage(query.saved)}
          </div>
        ) : null}
        {query.error ? (
          <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]">
            {query.error === "duplicate"
              ? "Training konnte nicht dupliziert werden. Bitte erneut versuchen."
              : query.error === "item-level"
                ? "Level konnte nicht gespeichert werden. Bitte erneut versuchen."
                : query.error === "organization"
                  ? "Solo-/Teamorganisation konnte nicht gespeichert werden. Prüfe die Teamgröße."
                  : query.error === "programming"
                    ? "Hauptteil-Programmierung konnte nicht gespeichert werden. Bitte die Werte prüfen."
              : query.error === "version" ? "Version konnte nicht erstellt werden. Bitte erneut versuchen."
                : query.error === "restore" ? "Version konnte nicht wiederhergestellt werden."
                : query.error === "template" ? "Vereinsvorlage konnte nicht gespeichert werden. Bitte Eingaben und Training prüfen."
                  : "Änderung konnte nicht gespeichert werden. Bitte Eingaben prüfen und erneut versuchen."}
          </div>
        ) : null}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-black">Versionen</h2><p className="mt-1 text-sm text-[var(--muted)]">Snapshots sichern Training, Phasen und Übungen für eine spätere Wiederherstellung.</p></div>
            <form action={createTrainingVersionAction.bind(null, session.id)}><button className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 text-sm font-black" type="submit">Snapshot erstellen</button></form>
          </div>
          {versions.length ? <ul className="mt-3 grid gap-2 text-xs text-[var(--muted)]">{versions.map((version) => <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2" key={version.id}><span><strong className="text-[var(--foreground)]">Version {version.versionNumber}</strong> · {version.createdAt}{version.createdBy ? ` · ${version.createdBy}` : ""}</span><form action={restoreTrainingVersionAction}><input name="sessionId" type="hidden" value={session.id} /><input name="versionId" type="hidden" value={version.id} /><button className="rounded-lg border border-[var(--border)] px-2 py-1 font-black" type="submit">Wiederherstellen</button></form></li>)}</ul> : <p className="mt-3 text-sm text-[var(--muted)]">Noch kein Snapshot vorhanden.</p>}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div>
            <h2 className="font-black">Als Vereinsvorlage speichern</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Speichert die aktuelle Übungsauswahl, Hauptteilstruktur, Programmierung und Teamorganisation als wiederverwendbaren Snapshot.
            </p>
          </div>
          <form action={createClubTrainingTemplateAction} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-end">
            <input name="sessionId" type="hidden" value={session.id} />
            <label className="grid gap-1 text-sm font-bold">
              Vorlagenname
              <input
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                defaultValue={session.title}
                maxLength={120}
                minLength={2}
                name="name"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Beschreibung
              <input
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                maxLength={1000}
                name="description"
                placeholder="Optional: Einsatz, Gruppe oder besondere Hinweise"
              />
            </label>
            <button className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 text-sm font-black" type="submit">
              Vorlage speichern
            </button>
          </form>
          <div className="mt-3 text-xs text-[var(--muted)]">
            <Link className="font-bold underline underline-offset-2" href="/training/templates">Vereinsvorlagen verwalten</Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard label="Status" value={statusLabel(session.status)} />
          <InfoCard label="Quelle" value={sourceLabel(session.source)} />
          <InfoCard label="Dauer" value={`${session.totalDurationMinutes} Min.`} />
          <InfoCard
            label="Organisation"
            value={session.organizationMode === "team"
              ? `Team · ${session.teamSize ?? 2} Pers./Team · ${mainPartCount} ${mainPartCount === 1 ? "Hauptteil" : "Hauptteile"}`
              : `Individuell · ${mainPartCount} ${mainPartCount === 1 ? "Hauptteil" : "Hauptteile"}`}
          />
        </section>

        {editable ? (
          <form
            action={updateTrainingOrganizationAction}
            className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <input name="sessionId" type="hidden" value={session.id} />
            <label className="grid gap-2 text-sm font-bold">
              Organisation Hauptteil
              <select
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                defaultValue={session.organizationMode}
                name="organizationMode"
              >
                <option value="solo">Alleine / individuelle Rotation</option>
                <option value="team">Teams</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Teamgröße
              <input
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                defaultValue={session.teamSize ?? 4}
                max={20}
                min={2}
                name="teamSize"
                type="number"
              />
              <span className="text-xs font-normal leading-5 text-[var(--muted)]">Wird nur bei Teamorganisation verwendet.</span>
            </label>
            <button
              className="min-h-11 self-end rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 text-sm font-black hover:bg-[var(--surface-elevated)]"
              type="submit"
            >
              Organisation speichern
            </button>
          </form>
        ) : null}

        <form
          action={updateMetadataAction}
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
          <Disclosure className="md:col-span-2 xl:col-span-3" summaryClassName="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2.5 text-sm font-bold" summary="Optionale Route & GPS-Daten">
            <div className="mt-3 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">Routenname<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={session.routeName ?? ""} maxLength={160} name="routeName" placeholder="z. B. Vereinsrunde" /></label>
              <label className="grid gap-2 text-sm font-bold">Strecke (m)<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={session.routeDistanceMetres ?? ""} min="0.1" name="routeDistanceMetres" step="0.1" type="number" /></label>
              <label className="grid gap-2 text-sm font-bold">Untergrund<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={session.routeSurface ?? ""} maxLength={160} name="routeSurface" placeholder="Asphalt, Waldweg …" /></label>
              <label className="grid gap-2 text-sm font-bold">GPS-/Kartenreferenz<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={session.routeGpsReference ?? ""} maxLength={500} name="routeGpsReference" placeholder="Link oder interne Referenz" /></label>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">Routenhinweise<textarea className="min-h-20 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-normal" defaultValue={session.routeNotes ?? ""} maxLength={2000} name="routeNotes" /></label>
            </div>
          </Disclosure>
          <button
            className="min-h-11 self-end rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)]"
            type="submit"
          >
            Metadaten speichern
          </button>
        </form>

        {!editable ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--muted)]">
            Archivierte Trainings sind schreibgeschützt. Setze den Status auf „Entwurf“, „Bereit“ oder „Abgeschlossen“, um Inhalte wieder zu bearbeiten.
          </div>
        ) : null}

        <section className="space-y-4">
          {session.phases.map((phase) => (
            <article
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
              id={`phase-${phase.id}`}
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

              {phase.kind === "main" && phase.items.length > 0 ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {mainPartSummaries(phase.items).map((part) => editable ? (
                    <PersistedMainPartProgrammingForm
                      initialProgramming={part.programming}
                      key={part.index}
                      mainPartIndex={part.index}
                      sessionId={session.id}
                      title={part.title}
                    />
                  ) : (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm" key={part.index}>
                      <span className="font-black">{part.title}</span>
                      {part.programming && part.programming.mode !== "standard" ? (
                        <span className="ml-2 text-[var(--muted)]">· {programmingSummary(part.programming)}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4">
                {phase.items.length > 0 ? (
                  <TrainingItemReorderZone
                    action={reorderTrainingItemsAction}
                    itemIds={phase.items.map((item) => item.id)}
                    phaseId={phase.id}
                    sessionId={session.id}
                  >
                    {phase.items.map((item, index) => (
                      <div
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4"
                        data-training-drop-id={item.id}
                        id={`item-${item.id}`}
                        key={item.id}
                      >
                        <div className="grid gap-3 sm:grid-cols-[42px_minmax(0,1fr)_auto]">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="grid size-9 place-items-center rounded-full bg-[var(--surface)] text-sm font-black ring-1 ring-[var(--border)]">
                              {index + 1}
                            </div>
                            {editable && phase.items.length > 1 ? (
                              <button
                                aria-label={`${item.exerciseName} per Drag-and-Drop verschieben`}
                                className="cursor-grab rounded-md px-2 py-1 text-sm font-black text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)] active:cursor-grabbing"
                                data-training-drag-id={item.id}
                                draggable
                                title="Ziehen, um die Reihenfolge zu ändern"
                                type="button"
                              >
                                ↕
                              </button>
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black">{item.exerciseName}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs font-bold text-[var(--muted)]">
                              {phase.kind === "main" ? (
                                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[var(--foreground)]">
                                  {item.mainPartTitle ?? `Hauptteil ${item.mainPartIndex ?? 1}`}
                                </span>
                              ) : null}
                              {item.format ? <span>{item.format}</span> : null}
                              {item.levelLabel ? <span>· {item.levelLabel}</span> : null}
                            </div>
                            <TrainingItemGuidance
                              editable={editable}
                              guidance={item.exerciseId ? guidanceByExerciseId[item.exerciseId] : undefined}
                              itemId={item.id}
                              selectedLevel={item.levelLabel}
                              sessionId={session.id}
                              trainerInstructions={item.instructions}
                            />
                          </div>
                          <div className="font-black">{item.durationMinutes} Min.</div>
                        </div>

                        {editable ? (
                          <div className="mt-4 border-t border-[var(--border)] pt-3">
                            <div className="flex flex-wrap items-start gap-2">
                              <form action={moveTrainingItemAction}>
                                <input name="sessionId" type="hidden" value={session.id} />
                                <input name="itemId" type="hidden" value={item.id} />
                                <input name="direction" type="hidden" value="up" />
                                <button
                                  aria-label={`${item.exerciseName} nach oben verschieben`}
                                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black hover:bg-[var(--surface-elevated)] disabled:opacity-35"
                                  disabled={index === 0}
                                  type="submit"
                                >
                                  ↑
                                </button>
                              </form>
                              <form action={moveTrainingItemAction}>
                                <input name="sessionId" type="hidden" value={session.id} />
                                <input name="itemId" type="hidden" value={item.id} />
                                <input name="direction" type="hidden" value="down" />
                                <button
                                  aria-label={`${item.exerciseName} nach unten verschieben`}
                                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black hover:bg-[var(--surface-elevated)] disabled:opacity-35"
                                  disabled={index === phase.items.length - 1}
                                  type="submit"
                                >
                                  ↓
                                </button>
                              </form>
                              <div className="min-w-[240px] flex-1 space-y-2">
                                <Disclosure className="rounded-lg border border-[var(--border)] bg-[var(--surface)]" summaryClassName="px-3 py-2 text-xs font-black" summary="Eintrag bearbeiten">
                                  <form action={updateTrainingItemAction} className="grid gap-3 border-t border-[var(--border)] p-3">
                                    <input name="sessionId" type="hidden" value={session.id} />
                                    <input name="itemId" type="hidden" value={item.id} />
                                    <div className="grid gap-3 md:grid-cols-3">
                                      <label className="grid gap-1 text-xs font-bold">
                                        Dauer (Min.)
                                        <input
                                          className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                                          defaultValue={item.durationMinutes}
                                          min={1}
                                          name="durationMinutes"
                                          required
                                          type="number"
                                        />
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold">
                                        Format
                                        <select
                                          className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                                          defaultValue={item.format ?? ""}
                                          name="format"
                                        >
                                          <option value="">Kein spezielles Format</option>
                                          <option value="free">Frei</option>
                                          <option value="circuit">Zirkel</option>
                                          <option value="tabata">Tabata</option>
                                          <option value="amrap">AMRAP</option>
                                          <option value="emom">EMOM</option>
                                          <option value="rig-run">Rig & Run</option>
                                          <option value="run-exercise">Run + Exercise</option>
                                          <option value="technique">Technik</option>
                                          <option value="relay">Team / Relay</option>
                                          <option value="partner">Partner Workout</option>
                                          <option value="team-competition">Teamwettkampf</option>
                                        </select>
                                      </label>
                                      <label className="grid gap-1 text-xs font-bold">
                                        Level / freie Variante
                                        <input
                                          className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                                          defaultValue={item.levelLabel ?? ""}
                                          maxLength={120}
                                          name="levelLabel"
                                        />
                                      </label>
                                    </div>
                                    {phase.kind === "main" ? (
                                      <div className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-3 md:grid-cols-2">
                                        <label className="grid gap-1 text-xs font-bold">
                                          Hauptteil Nr.
                                          <input
                                            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                                            defaultValue={item.mainPartIndex ?? 1}
                                            max={12}
                                            min={1}
                                            name="mainPartIndex"
                                            type="number"
                                          />
                                        </label>
                                        <label className="grid gap-1 text-xs font-bold">
                                          Hauptteil-Bezeichnung
                                          <input
                                            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                                            defaultValue={item.mainPartTitle ?? `Hauptteil ${item.mainPartIndex ?? 1}`}
                                            maxLength={120}
                                            name="mainPartTitle"
                                          />
                                        </label>
                                      </div>
                                    ) : null}
                                    <label className="grid gap-1 text-xs font-bold">
                                      Trainingshinweis
                                      <textarea
                                        className="min-h-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 font-normal leading-6"
                                        defaultValue={item.instructions ?? ""}
                                        maxLength={4000}
                                        name="instructions"
                                      />
                                    </label>
                                    <div className="flex justify-end">
                                      <button
                                        className="rounded-lg bg-[var(--control-strong)] px-4 py-2 text-xs font-black text-[var(--control-strong-foreground)]"
                                        type="submit"
                                      >
                                        Eintrag speichern
                                      </button>
                                    </div>
                                  </form>
                                </Disclosure>
                                <ReplaceTrainingItemForm
                                  currentExerciseName={item.exerciseName}
                                  itemId={item.id}
                                  sessionId={session.id}
                                />
                                <TrainingItemAlternatives
                                  activeItemId={query.alternativeItem}
                                  activeMode={query.alternativeMode}
                                  currentExerciseName={item.exerciseName}
                                  itemId={item.id}
                                  sessionId={session.id}
                                />
                              </div>
                              <form action={deleteTrainingItemAction}>
                                <input name="sessionId" type="hidden" value={session.id} />
                                <input name="itemId" type="hidden" value={item.id} />
                                <button
                                  aria-label={`${item.exerciseName} aus Training entfernen`}
                                  className="rounded-lg border border-[var(--danger)] px-3 py-2 text-xs font-black text-[var(--danger)] hover:bg-[var(--danger-bg)]"
                                  type="submit"
                                >
                                  Entfernen
                                </button>
                              </form>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </TrainingItemReorderZone>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                    Diese Phase enthält noch keine Übung.
                  </div>
                )}
              </div>

              {editable ? <AddTrainingItemForm phaseId={phase.id} sessionId={session.id} /> : null}
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

function mainPartSummaries(items: readonly {
  readonly mainPartIndex: number | null;
  readonly mainPartTitle: string | null;
  readonly programming: import("@/domain/training/model").MainPartProgramming | null;
}[]) {
  const summaries = new Map<number, {
    readonly index: number;
    readonly title: string;
    readonly programming: import("@/domain/training/model").MainPartProgramming | null;
  }>();
  for (const item of items) {
    const index = item.mainPartIndex ?? 1;
    if (!summaries.has(index)) {
      summaries.set(index, {
        index,
        title: item.mainPartTitle ?? `Hauptteil ${index}`,
        programming: item.programming,
      });
    }
  }
  return [...summaries.values()].sort((left, right) => left.index - right.index);
}

function programmingSummary(programming: import("@/domain/training/model").MainPartProgramming): string {
  if (programming.mode === "interval") return `${programming.workSeconds ?? 0}s Arbeit / ${programming.restSeconds ?? 0}s Pause`;
  if (programming.mode === "rounds") return `${programming.rounds ?? 1} Runden · ${programming.scoreMode === "time" ? "auf Zeit" : "auf Qualität"}`;
  if (programming.mode === "ladder") return `Ladder ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1}`;
  if (programming.mode === "reverse-ladder") return `Reverse Ladder ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1}`;
  if (programming.mode === "pyramid") return `Pyramide ${programming.ladderStart ?? 1}→${programming.ladderEnd ?? 1}→${programming.ladderStart ?? 1}`;
  if (programming.mode === "chipper") return "Chipper";
  if (programming.mode === "every") return programming.everyUnit === "checkpoint"
    ? `jeder ${programming.everyValue ?? 1}. Checkpoint`
    : `alle ${programming.everyValue ?? 1} ${programming.everyUnit === "minutes" ? "Min." : "m"}`;
  return "Standard / frei";
}

function savedMessage(saved: string): string {
  if (saved === "item") return "Trainingsinhalt wurde aktualisiert.";
  if (saved === "item-level") return "Level-Zuordnung wurde aktualisiert.";
  if (saved === "organization") return "Solo-/Teamorganisation wurde aktualisiert.";
  if (saved === "programming") return "Hauptteil-Programmierung wurde aktualisiert.";
  if (saved === "duplicated") return "Training wurde als neue Kopie angelegt.";
  if (saved === "combined") return "Kombiniertes Training wurde als neuer Entwurf angelegt.";
  if (saved === "version") return "Training-Snapshot wurde erstellt.";
  if (saved === "restore") return "Training-Snapshot wurde wiederhergestellt.";
  if (saved === "template") return "Training wurde als Vereinsvorlage gespeichert.";
  if (saved === "from-template") return "Neues Training wurde aus einer Vereinsvorlage erstellt.";
  return "Training wurde aktualisiert.";
}

function sourceLabel(source: string): string {
  if (source === "manual") return "Quick Create";
  if (source === "copied") return "Kopie";
  if (source === "combined") return "Kombiniert";
  if (source === "template") return "Vorlage";
  return source;
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
