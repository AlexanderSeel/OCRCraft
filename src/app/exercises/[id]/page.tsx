import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MuscleMap } from "@/components/body/muscle-map";
import { exerciseCategoryLabels, exercisePhaseLabels } from "@/domain/exercise/model";
import { getExerciseFacetEditorData } from "@/server/exercises/exercise-facet-repository";
import { getExerciseById } from "@/server/exercises/exercise-repository";
import { getTrainingExerciseGuidanceMap } from "@/server/training/training-exercise-guidance-repository";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const exercise = await getExerciseById(id);
  if (!exercise) notFound();

  const [facets, guidanceDeMap, guidanceEnMap] = await Promise.all([
    getExerciseFacetEditorData(id),
    getTrainingExerciseGuidanceMap([id], "de"),
    getTrainingExerciseGuidanceMap([id], "en"),
  ]);
  const guidance = guidanceDeMap[id];
  const guidanceEn = guidanceEnMap[id];

  const movementPatterns = facets.movementPatterns.filter((option) => facets.selected.movementPatternIds.includes(option.id));
  const tags = facets.tags.filter((option) => facets.selected.tagIds.includes(option.id));
  const equipmentById = new Map(facets.equipment.map((option) => [option.id, option]));
  const bodyRegionById = new Map(facets.bodyRegions.map((option) => [option.id, option]));
  const selectedEquipment = facets.selected.equipment.flatMap((selection) => {
    const option = equipmentById.get(selection.id);
    return option ? [{ ...option, quantityRequired: selection.quantityRequired }] : [];
  });
  const muscleOppositions = facets.selected.muscleOppositions.map((item) => {
    const primary = bodyRegionById.get(item.primaryRegionId)?.labelDe ?? item.primaryRegionId;
    const opposing = bodyRegionById.get(item.opposingRegionId)?.labelDe ?? item.opposingRegionId;
    return `${primary} ↔ ${opposing}`;
  });

  return (
    <AppShell
      title={exercise.nameDe}
      subtitle={exercise.summaryDe || "Übungsdetails, Coaching und Skalierung"}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl bg-[var(--control-strong)] px-4 py-2.5 text-sm font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)]"
            href={`/exercises/${exercise.id}/edit`}
          >
            Bearbeiten
          </Link>
          <Link
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
            href="/exercises"
          >
            ← Übungen
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <section aria-label="Übungsmetadaten" className="flex flex-wrap gap-2">
          <MetaTag label="Bereich" value={exerciseCategoryLabels[exercise.category] ?? exercise.category} />
          <MetaTag label="Phase" value={exercisePhaseLabels[exercise.phase] ?? exercise.phase} />
          <MetaTag label="Risiko" value={riskLabel(exercise.riskLevel)} />
          <MetaTag label="Alter" value={exercise.minAge == null ? "Kein Limit" : `ab ${exercise.minAge}`} />
          <MetaTag label="Status" value={exercise.archived ? "Archiviert" : "Aktiv"} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="space-y-5">
            <Card title="Kurz erklärt">
              <TextBlock value={exercise.summaryDe || guidance?.summary} fallback="Noch keine Kurzbeschreibung hinterlegt." />
              {guidance?.purpose ? <SubSection title="Trainingszweck">{guidance.purpose}</SubSection> : null}
            </Card>

            <Card title="Ausführung">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <OptionalSection title="Aufbau" value={guidance?.setup} />
                  <OptionalSection title="Startposition" value={guidance?.startPosition} />
                  <OptionalSection title="Abschluss / Reset" value={guidance?.finishReset} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Schritt für Schritt</h3>
                  {guidance?.executionSteps.length ? (
                    <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
                      {guidance.executionSteps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
                    </ol>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--muted)]">Noch keine Ausführungsschritte hinterlegt.</p>
                  )}
                </div>
              </div>
            </Card>

            <Card title="Coaching">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Coaching-Cues</h3>
                  {guidance?.coachingCues.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                      {guidance.coachingCues.map((cue, index) => <li key={`${index}-${cue}`}>{cue}</li>)}
                    </ul>
                  ) : <p className="mt-2 text-sm text-[var(--muted)]">Keine Coaching-Cues hinterlegt.</p>}
                </div>
                <div className="space-y-4">
                  <OptionalSection title="Atmung" value={guidance?.breathingCue} />
                  <OptionalSection title="Tempo" value={guidance?.tempoCue} />
                  <OptionalSection title="Qualitätskriterium" value={guidance?.qualityCriteria} />
                </div>
              </div>
            </Card>

            <Card title="Häufige Fehler & Korrektur">
              {guidance?.commonMistakes.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {guidance.commonMistakes.map((entry, index) => (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" key={`${index}-${entry.mistake}`}>
                      <div className="text-sm font-black">{entry.mistake}</div>
                      <div className="mt-2 text-sm leading-6 text-[var(--muted)]"><span className="font-black text-[var(--foreground)]">Korrektur:</span> {entry.correction}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-[var(--muted)]">Noch keine typischen Fehler hinterlegt.</p>}
            </Card>

            <Card title="Sicherheit & Logistik">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <OptionalSection title="Sicherheit" value={guidance?.safetyNotes} prominent />
                  <OptionalSection title="Voraussetzungen" value={guidance?.prerequisites} />
                  <OptionalSection title="Fallback" value={guidance?.fallbackExercise} />
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <InfoValue label="Aufsicht" value={supervisionLabel(guidance?.supervision)} />
                  <InfoValue label="Platz" value={guidance?.spaceRequirement ?? "–"} />
                  <InfoValue label="Aufbau" value={secondsLabel(guidance?.setupSeconds)} />
                  <InfoValue label="Wechsel" value={secondsLabel(guidance?.transitionSeconds)} />
                  <InfoValue label="Stationskapazität" value={guidance?.stationCapacity == null ? "–" : `${guidance.stationCapacity} Pers.`} />
                  <InfoValue label="Max. gleichzeitig" value={guidance?.maxSimultaneousParticipants == null ? "–" : `${guidance.maxSimultaneousParticipants} Pers.`} />
                  <InfoValue label="Schwierigkeit" value={difficultyLabel(guidance?.difficulty)} />
                  <InfoValue label="Untergrund" value={guidance?.surfaceRequirements ?? "–"} />
                  <InfoValue label="Wetter / Gelände" value={guidance?.weatherTerrain ?? "–"} />
                  {guidance?.obstacleConfiguration ? <InfoValue label="Hindernis-Konfiguration" value={guidance.obstacleConfiguration} /> : null}
                </dl>
              </div>
            </Card>

            <Card title="Dosierung & Skalierung">
              <div className="grid gap-3 lg:grid-cols-3">
                <LevelCard title="Einsteiger" value={guidance?.beginnerPrescription} />
                <LevelCard title="Standard" value={guidance?.standardPrescription} />
                <LevelCard title="Fortgeschritten" value={guidance?.advancedPrescription} />
              </div>
              <OptionalSection title="Belastung / Pause" value={guidance?.workRestGuidance} />
              {guidance?.paceGuidance ? <OptionalSection title="Pace / Tempoleitlinie" value={guidance.paceGuidance} /> : null}
              {guidance?.heartRateZone ? <OptionalSection title="Herzfrequenz-Zone" value={guidance.heartRateZone} /> : null}
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <LevelCard title="Level 1" value={guidance?.level1} />
                <LevelCard title="Level 2" value={guidance?.level2} />
                <LevelCard title="Level 3" value={guidance?.level3} />
              </div>
              <OptionalSection title="Kinder-/Jugendvariante" value={guidance?.childYouthVariant} />
            </Card>
          </div>

          <aside className="space-y-5">
            <Card title="Muskeln & Gegenmuskeln">
              {facets.selected.bodyRegions.length ? (
                <MuscleMap
                  disabled
                  mode="emphasis"
                  options={facets.bodyRegions}
                  value={facets.selected.bodyRegions}
                  visualCompact
                />
              ) : <p className="text-sm text-[var(--muted)]">Noch keine Muskelregionen zugeordnet.</p>}
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <FacetList title="Gespeicherte Gegenmuskel-Paare" values={muscleOppositions} />
              </div>
            </Card>

            <Card title="Trainings-Metadaten">
              <FacetList title="Bewegungsmuster" values={movementPatterns.map((item) => item.labelDe)} />
              <FacetList title="Tags" values={tags.map((item) => item.labelDe)} />
              <FacetList
                title="Equipment"
                values={selectedEquipment.map((item) => `${item.labelDe}${item.quantityRequired > 1 ? ` × ${item.quantityRequired}` : ""}`)}
              />
              <FacetList title="Aliase" values={exercise.aliasesDe} />
            </Card>

            <Card title="Quelle / Provenienz">
              <dl className="space-y-3 text-sm">
                <InfoValue label="Katalogschlüssel" value={exercise.seedKey ?? "Manuell angelegt"} />
                <InfoValue label="Quelle" value={exercise.sourceProvider ?? "OCRCraft"} />
                {exercise.sourceLicenseLabel ? <InfoValue label="Lizenz" value={exercise.sourceLicenseLabel} /> : null}
                <InfoValue label="DE" value={exercise.nameDe} />
                <InfoValue label="EN" value={exercise.nameEn} />
              </dl>
              {exercise.sourceUrl ? <a className="mt-3 block break-all text-sm font-bold underline" href={exercise.sourceUrl} rel="noreferrer" target="_blank">Quelle öffnen</a> : null}
            </Card>
          </aside>
        </section>

        {guidanceEn ? (
          <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <summary className="cursor-pointer px-5 py-4 font-black">English reference</summary>
            <div className="grid gap-5 border-t border-[var(--border)] p-5 lg:grid-cols-2">
              <div>
                <h3 className="font-black">{exercise.nameEn}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{exercise.summaryEn || guidanceEn.summary || "No English summary."}</p>
                {guidanceEn.purpose ? <p className="mt-3 text-sm leading-6">{guidanceEn.purpose}</p> : null}
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Execution</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6">
                  {guidanceEn.executionSteps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
                </ol>
              </div>
            </div>
          </details>
        ) : null}
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">{title}</h3>
      <div className="mt-1 text-sm leading-6">{children}</div>
    </div>
  );
}

function TextBlock({ value, fallback }: { readonly value?: string | null; readonly fallback: string }) {
  return <p className="text-sm leading-7 text-[var(--foreground)]">{value || fallback}</p>;
}

function OptionalSection({ title, value, prominent = false }: { readonly title: string; readonly value?: string | null; readonly prominent?: boolean }) {
  if (!value) return null;
  return (
    <div className={prominent ? "rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-3" : ""}>
      <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">{title}</h3>
      <p className="mt-1 text-sm leading-6">{value}</p>
    </div>
  );
}

function MetaTag({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold">
      <span className="text-[var(--muted)]">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

function InfoValue({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
      <dt className="text-xs font-bold text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 font-black">{value}</dd>
    </div>
  );
}

function LevelCard({ title, value }: { readonly title: string; readonly value?: string | null }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
      <div className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">{title}</div>
      <p className="mt-2 text-sm leading-6">{value || "Noch nicht hinterlegt."}</p>
    </div>
  );
}

function FacetList({ title, values }: { readonly title: string; readonly values: readonly string[] }) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">{title}</h3>
      {values.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-bold" key={value}>{value}</span>)}
        </div>
      ) : <p className="mt-1 text-sm text-[var(--muted)]">Keine Angaben.</p>}
    </div>
  );
}

function riskLabel(risk: string): string {
  if (risk === "low") return "Niedrig";
  if (risk === "medium") return "Mittel";
  if (risk === "high") return "Hoch";
  return risk;
}

function difficultyLabel(value?: string | null): string {
  if (value === "beginner") return "Einsteiger";
  if (value === "intermediate") return "Mittel";
  if (value === "advanced") return "Fortgeschritten";
  return value ?? "–";
}

function supervisionLabel(value?: string | null): string {
  if (value === "normal") return "Normal";
  if (value === "increased") return "Erhöht";
  if (value === "direct") return "Direkt";
  return value ?? "–";
}

function secondsLabel(value?: number | null): string {
  if (value == null) return "–";
  if (value < 60) return `${value} Sek.`;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return seconds ? `${minutes} Min. ${seconds} Sek.` : `${minutes} Min.`;
}
