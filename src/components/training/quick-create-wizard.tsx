"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TrainingDraft } from "@/domain/training/draft";
import { BodyFocusSelector } from "./body-focus-selector";
import {
  ExerciseAutocompletePicker,
  type SelectedExerciseReference,
} from "./exercise-autocomplete-picker";
import {
  persistTrainingDraft,
  requestTrainingDraft,
  type QuickCreateDraftClientInput,
} from "./quick-create-draft-client";
import { TrainingDraftPreview } from "./training-draft-preview";

const groupOptions = [
  ["kids", "Kids", "Spielerisch, altersgerecht, klare Sicherheitsregeln"],
  ["youth", "Jugend", "Technik, Athletik und skalierbare Herausforderung"],
  ["adults", "Erwachsene", "Breitensport bis wettkampforientiert"],
  ["mixed", "Mixed", "Mehrere Levels in einer gemeinsamen Einheit"],
] as const;

const goalOptions = [
  "Ganzkörper",
  "OCR-Technik",
  "Grip",
  "Kraftausdauer",
  "Laufen",
  "Core",
  "Balance",
  "Koordination",
  "Mobility",
] as const;

const formatOptions = [
  ["circuit", "Zirkel", "Stationen rotieren in festen Intervallen"],
  ["rig-run", "Rig & Run", "Laufabschnitte mit OCR-Stationen kombinieren"],
  ["amrap", "AMRAP", "Eigenes Tempo innerhalb eines Zeitfensters"],
  ["emom", "EMOM", "Planbare Arbeit und Pause pro Minute"],
  ["tabata", "Tabata Style", "Kurze intensive Intervalle"],
  ["run-exercise", "Run + Exercise", "Alle X Meter oder Minuten eine Übung"],
  ["technique", "Technik", "Qualität und Hindernisprogression im Fokus"],
  ["relay", "Team / Relay", "Gruppen- und Staffelvarianten"],
] as const;

function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

export function QuickCreateWizard() {
  const [step, setStep] = useState(1);
  const [groupType, setGroupType] = useState("mixed");
  const [ageRange, setAgeRange] = useState("16+");
  const [participantCount, setParticipantCount] = useState(16);
  const [duration, setDuration] = useState(75);
  const [goals, setGoals] = useState<readonly string[]>(["Ganzkörper", "OCR-Technik"]);
  const [bodyRegions, setBodyRegions] = useState<readonly string[]>(["forearms-grip", "core"]);
  const [preferredExercises, setPreferredExercises] = useState<readonly SelectedExerciseReference[]>([]);
  const [formats, setFormats] = useState<readonly string[]>(["rig-run"]);
  const [intensity, setIntensity] = useState("balanced");
  const [draft, setDraft] = useState<TrainingDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [persisting, setPersisting] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [persistedId, setPersistedId] = useState<string | null>(null);

  const selectedGroup = groupOptions.find(([id]) => id === groupType);
  const canContinue = useMemo(() => {
    if (step === 2) return goals.length > 0;
    if (step === 3) return formats.length > 0;
    return true;
  }, [formats.length, goals.length, step]);

  function currentDraftInput(): QuickCreateDraftClientInput {
    return {
      groupType,
      ageRange,
      participantCount,
      durationMinutes: duration,
      goals,
      bodyRegions,
      formats,
      intensity,
      preferredExerciseIds: preferredExercises.map((item) => item.id),
    };
  }

  async function generateDraft() {
    setGenerating(true);
    setGenerationError(null);
    setPersistenceError(null);
    setPersistedId(null);
    try {
      const nextDraft = await requestTrainingDraft(currentDraftInput());
      setDraft(nextDraft);
    } catch (error) {
      setDraft(null);
      setGenerationError(error instanceof Error ? error.message : "Trainingsentwurf konnte nicht erstellt werden.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setPersisting(true);
    setPersistenceError(null);
    try {
      const result = await persistTrainingDraft(currentDraftInput(), sessionTitle);
      setDraft(result.draft);
      setPersistedId(result.id);
    } catch (error) {
      setPersistenceError(error instanceof Error ? error.message : "Trainingsentwurf konnte nicht gespeichert werden.");
    } finally {
      setPersisting(false);
    }
  }

  function goBack() {
    if (step === 5) {
      setDraft(null);
      setGenerationError(null);
      setPersistenceError(null);
      setPersistedId(null);
    }
    setStep((current) => Math.max(1, current - 1));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <header className="border-b border-[var(--border)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Quick Create</div>
              <h2 className="mt-1 text-xl font-black">Schritt {step} von 5</h2>
            </div>
            <div className="flex gap-1.5" aria-label={`Schritt ${step} von 5`}>
              {[1, 2, 3, 4, 5].map((number) => (
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-8 rounded-full ${number <= step ? "bg-[var(--control-strong)]" : "bg-[var(--border)]"}`}
                  key={number}
                />
              ))}
            </div>
          </div>
        </header>

        <div className="min-h-[500px] p-5 sm:p-6">
          {step === 1 ? (
            <div>
              <h3 className="text-lg font-black">Für wen und wie lange?</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Diese Angaben steuern Skalierung, Umfang und spätere Vereinsregeln.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {groupOptions.map(([id, label, description]) => (
                  <button
                    className={`min-h-28 rounded-xl border p-4 text-left transition ${
                      groupType === id
                        ? "border-[var(--control-strong)] bg-[var(--control-strong)] text-[var(--control-strong-foreground)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-subtle)]"
                    }`}
                    key={id}
                    onClick={() => setGroupType(id)}
                    type="button"
                  >
                    <span className="block font-black">{label}</span>
                    <span className={`mt-1 block text-sm leading-5 ${groupType === id ? "opacity-70" : "text-[var(--muted)]"}`}>
                      {description}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-bold">
                  Alter / Bereich
                  <input
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                    onChange={(event) => setAgeRange(event.target.value)}
                    value={ageRange}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Teilnehmer
                  <input
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                    min={1}
                    onChange={(event) => setParticipantCount(Number(event.target.value))}
                    type="number"
                    value={participantCount}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Dauer
                  <select
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                    onChange={(event) => setDuration(Number(event.target.value))}
                    value={duration}
                  >
                    {[45, 60, 75, 90, 120].map((minutes) => (
                      <option key={minutes} value={minutes}>{minutes} Minuten</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h3 className="text-lg font-black">Was soll die Einheit erreichen?</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Wähle einen klaren Schwerpunkt und optional unterstützende Bereiche.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {goalOptions.map((goal) => (
                  <button
                    aria-pressed={goals.includes(goal)}
                    className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold ${
                      goals.includes(goal)
                        ? "border-[var(--control-strong)] bg-[var(--control-strong)] text-[var(--control-strong-foreground)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)]"
                    }`}
                    key={goal}
                    onClick={() => setGoals(toggleValue(goals, goal))}
                    type="button"
                  >
                    {goal}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <div className="font-black">Körperregionen</div>
                <p className="mt-1 text-sm text-[var(--muted)]">Wähle direkt auf der Körperansicht oder über die beschrifteten Bereiche.</p>
                <div className="mt-4">
                  <BodyFocusSelector
                    onToggle={(regionId) => setBodyRegions(toggleValue(bodyRegions, regionId))}
                    selected={bodyRegions}
                  />
                </div>
              </div>

              <div className="mt-8 border-t border-[var(--border)] pt-6">
                <ExerciseAutocompletePicker
                  description="Optional: echte Übungen oder Hindernisse aus der Bibliothek vormerken. Namen, Aliase, Tags, Equipment und Körperregionen werden durchsucht."
                  label="Wunschübungen / Hindernisse"
                  onChange={setPreferredExercises}
                  selected={preferredExercises}
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h3 className="text-lg font-black">Wie soll trainiert werden?</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Formate lassen sich kombinieren und später einzelnen Trainingsblöcken zuweisen.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {formatOptions.map(([id, label, description]) => (
                  <button
                    aria-pressed={formats.includes(id)}
                    className={`rounded-xl border p-4 text-left ${
                      formats.includes(id)
                        ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)]"
                    }`}
                    key={id}
                    onClick={() => setFormats(toggleValue(formats, id))}
                    type="button"
                  >
                    <span className="block font-black">{label}</span>
                    <span className="mt-1 block text-sm leading-5 text-[var(--muted)]">{description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h3 className="text-lg font-black">Wie anspruchsvoll?</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Belastungssteuerung darf konfigurierte Sicherheitsregeln nie überschreiben.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["technique", "Technik zuerst", "Mehr Qualität, längere Lernfenster"],
                  ["balanced", "Ausgewogen", "Technik und Conditioning kombinieren"],
                  ["conditioning", "Conditioning", "Mehr Lauf-/Kraftausdauer bei sauberer Technik"],
                ].map(([id, label, description]) => (
                  <button
                    className={`rounded-xl border p-4 text-left ${
                      intensity === id
                        ? "border-[var(--control-strong)] bg-[var(--control-strong)] text-[var(--control-strong-foreground)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)]"
                    }`}
                    key={id}
                    onClick={() => setIntensity(id)}
                    type="button"
                  >
                    <span className="block font-black">{label}</span>
                    <span className={`mt-1 block text-sm leading-5 ${intensity === id ? "opacity-70" : "text-[var(--muted)]"}`}>
                      {description}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <div className="font-black">Automatische Skalierung</div>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Schwierige Stationen erhalten Level 1–3. Bei Mixed-Gruppen werden gemeinsame Bewegungsmuster mit unterschiedlichen Griffen, Lasten, Distanzen oder Wiederholungen bevorzugt.
                </p>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <h3 className="text-lg font-black">Entwurf prüfen</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Diese Parameter werden gegen den realen Übungspool und die deterministischen Planungsregeln ausgewertet.</p>

              <dl className="mt-5 divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                {[
                  ["Gruppe", `${selectedGroup?.[1] ?? groupType} · ${ageRange} · ${participantCount} Personen`],
                  ["Dauer", `${duration} Minuten`],
                  ["Ziele", goals.join(", ")],
                  ["Körperregionen", bodyRegions.length ? bodyRegions.join(", ") : "Keine Vorgabe"],
                  ["Wunschübungen", preferredExercises.length ? preferredExercises.map((item) => item.label).join(", ") : "Keine Vorgabe"],
                  ["Formate", formats.join(", ")],
                  ["Ausrichtung", intensity],
                ].map(([label, value]) => (
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr]" key={label}>
                    <dt className="text-sm font-bold text-[var(--muted)]">{label}</dt>
                    <dd className="text-sm font-bold">{value}</dd>
                  </div>
                ))}
              </dl>

              {draft ? (
                <label className="mt-5 grid gap-2 text-sm font-bold">
                  Trainingstitel
                  <input
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                    maxLength={120}
                    onChange={(event) => setSessionTitle(event.target.value)}
                    placeholder="z. B. OCR Technik & Ausdauer Dienstag"
                    value={sessionTitle}
                  />
                  <span className="font-normal text-[var(--muted)]">Optional. Ohne Titel wird der Standardtitel des Entwurfs verwendet.</span>
                </label>
              ) : null}

              {generationError ? (
                <div className="mt-5 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm">
                  <div className="font-black text-[var(--danger)]">Entwurf konnte nicht erstellt werden</div>
                  <p className="mt-1 leading-6">{generationError}</p>
                </div>
              ) : null}

              {persistenceError ? (
                <div className="mt-5 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm">
                  <div className="font-black text-[var(--danger)]">Entwurf konnte nicht gespeichert werden</div>
                  <p className="mt-1 leading-6">{persistenceError}</p>
                </div>
              ) : null}

              {persistedId ? (
                <div className="mt-5 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm">
                  <div className="font-black text-[var(--success-foreground)]">Training gespeichert</div>
                  <p className="mt-1 leading-6 text-[var(--success-foreground)]">
                    Der Server hat den Entwurf erneut aus der aktuellen Übungsdatenbank erzeugt, validiert und transaktional gespeichert.
                  </p>
                  <Link className="mt-3 inline-flex font-black text-[var(--foreground)] underline underline-offset-4" href="/training">
                    Gespeicherte Trainings öffnen
                  </Link>
                </div>
              ) : null}

              {draft ? <TrainingDraftPreview draft={draft} /> : null}
            </div>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] p-5 sm:p-6">
          <button
            className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={step === 1 || generating || persisting}
            onClick={goBack}
            type="button"
          >
            Zurück
          </button>
          {step < 5 ? (
            <button
              className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canContinue}
              onClick={() => setStep((current) => Math.min(5, current + 1))}
              type="button"
            >
              Weiter
            </button>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-black hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={generating || persisting}
                onClick={() => void generateDraft()}
                type="button"
              >
                {generating ? "Entwurf wird erstellt …" : draft ? "Entwurf neu erstellen" : "Trainingsentwurf erstellen"}
              </button>
              <button
                className="min-h-11 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!draft || generating || persisting}
                onClick={() => void saveDraft()}
                type="button"
              >
                {persisting ? "Wird gespeichert …" : persistedId ? "Erneut speichern" : "Training speichern"}
              </button>
            </div>
          )}
        </footer>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl bg-[var(--sidebar)] p-5 text-[var(--sidebar-foreground)]">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sidebar-muted)]">Live-Zusammenfassung</div>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-xs text-[var(--sidebar-muted)]">Gruppe</div>
              <div className="mt-1 font-black">{selectedGroup?.[1]} · {participantCount}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--sidebar-muted)]">Zeit</div>
              <div className="mt-1 font-black">{duration} Minuten</div>
            </div>
            <div>
              <div className="text-xs text-[var(--sidebar-muted)]">Fokus</div>
              <div className="mt-1 text-sm font-bold leading-6">{goals.join(" · ") || "Noch auswählen"}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--sidebar-muted)]">Wunschübungen</div>
              <div className="mt-1 text-sm font-bold leading-6">
                {preferredExercises.length ? preferredExercises.map((item) => item.label).join(" · ") : "Keine Vorgabe"}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--sidebar-muted)]">Format</div>
              <div className="mt-1 text-sm font-bold leading-6">{formats.join(" · ") || "Noch auswählen"}</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="font-black">Planungsprinzip</div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Der Wizard verwendet echte Bibliotheksübungen. Beim Speichern erzeugt und validiert der Server denselben Entwurf erneut, bevor er als bearbeitbarer Trainingsentwurf in DuckDB landet.
          </p>
        </section>
      </aside>
    </div>
  );
}
