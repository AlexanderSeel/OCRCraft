"use client";

import { useMemo, useState } from "react";

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

const bodyOptions = [
  ["shoulders", "Schultern"],
  ["upper-back", "Oberer Rücken"],
  ["forearms-grip", "Unterarme / Grip"],
  ["core", "Core"],
  ["hips", "Hüfte"],
  ["glutes", "Gesäß"],
  ["quadriceps", "Oberschenkel vorn"],
  ["hamstrings", "Oberschenkel hinten"],
  ["calves", "Waden"],
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
  const [formats, setFormats] = useState<readonly string[]>(["rig-run"]);
  const [intensity, setIntensity] = useState("balanced");
  const [generated, setGenerated] = useState(false);

  const selectedGroup = groupOptions.find(([id]) => id === groupType);
  const canContinue = useMemo(() => {
    if (step === 2) return goals.length > 0;
    if (step === 3) return formats.length > 0;
    return true;
  }, [formats.length, goals.length, step]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="rounded-2xl border border-[var(--border)] bg-white shadow-[0_10px_35px_rgba(20,28,35,0.04)]">
        <div className="border-b border-[var(--border)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Quick Create</div>
              <h2 className="mt-1 text-xl font-black">Schritt {step} von 5</h2>
            </div>
            <div className="flex gap-1.5" aria-label={`Schritt ${step} von 5`}>
              {[1, 2, 3, 4, 5].map((number) => (
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-8 rounded-full ${number <= step ? "bg-[var(--dark)]" : "bg-[var(--border)]"}`}
                  key={number}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="min-h-[480px] p-5 sm:p-6">
          {step === 1 ? (
            <div>
              <h3 className="text-lg font-black">Für wen und wie lange?</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Diese Angaben steuern Skalierung, Umfang und spätere Vereinsregeln.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {groupOptions.map(([id, label, description]) => (
                  <button
                    className={`min-h-28 rounded-xl border p-4 text-left transition ${
                      groupType === id
                        ? "border-[var(--dark)] bg-[var(--dark)] text-white"
                        : "border-[var(--border)] hover:border-[#aeb7bf] hover:bg-[var(--surface-subtle)]"
                    }`}
                    key={id}
                    onClick={() => setGroupType(id)}
                    type="button"
                  >
                    <span className="block font-black">{label}</span>
                    <span className={`mt-1 block text-sm leading-5 ${groupType === id ? "text-white/65" : "text-[var(--muted)]"}`}>
                      {description}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-bold">
                  Alter / Bereich
                  <input
                    className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none focus:border-[#4d75ff]"
                    onChange={(event) => setAgeRange(event.target.value)}
                    value={ageRange}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Teilnehmer
                  <input
                    className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none focus:border-[#4d75ff]"
                    min={1}
                    onChange={(event) => setParticipantCount(Number(event.target.value))}
                    type="number"
                    value={participantCount}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Dauer
                  <select
                    className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 font-normal outline-none focus:border-[#4d75ff]"
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
                        ? "border-[var(--dark)] bg-[var(--dark)] text-white"
                        : "border-[var(--border)] bg-white hover:bg-[var(--surface-subtle)]"
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
                <p className="mt-1 text-sm text-[var(--muted)]">Erste funktionale Auswahl; die grafische Front-/Rückansicht folgt als eigener BodyMap-Baustein.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {bodyOptions.map(([id, label]) => (
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] px-4 hover:bg-[var(--surface-subtle)]" key={id}>
                      <input
                        checked={bodyRegions.includes(id)}
                        onChange={() => setBodyRegions(toggleValue(bodyRegions, id))}
                        type="checkbox"
                      />
                      <span className="text-sm font-bold">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h3 className="text-lg font-black">Wie soll trainiert werden?</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Formate lassen sich kombinieren; später kann jedes Format einer einzelnen Phase zugewiesen werden.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {formatOptions.map(([id, label, description]) => (
                  <button
                    aria-pressed={formats.includes(id)}
                    className={`rounded-xl border p-4 text-left ${
                      formats.includes(id)
                        ? "border-[var(--dark)] bg-[#f0f4db]"
                        : "border-[var(--border)] hover:bg-[var(--surface-subtle)]"
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
              <p className="mt-1 text-sm text-[var(--muted)]">OCRCraft nutzt diese Auswahl für Belastung und Progression, nicht um Sicherheitsregeln zu überschreiben.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["technique", "Technik zuerst", "Mehr Qualität, längere Lernfenster"],
                  ["balanced", "Ausgewogen", "Technik und Conditioning kombinieren"],
                  ["conditioning", "Conditioning", "Mehr Lauf-/Kraftausdauer bei sauberer Technik"],
                ].map(([id, label, description]) => (
                  <button
                    className={`rounded-xl border p-4 text-left ${
                      intensity === id
                        ? "border-[var(--dark)] bg-[var(--dark)] text-white"
                        : "border-[var(--border)] hover:bg-[var(--surface-subtle)]"
                    }`}
                    key={id}
                    onClick={() => setIntensity(id)}
                    type="button"
                  >
                    <span className="block font-black">{label}</span>
                    <span className={`mt-1 block text-sm leading-5 ${intensity === id ? "text-white/65" : "text-[var(--muted)]"}`}>
                      {description}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <div className="font-black">Automatische Skalierung</div>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Schwierige Stationen sollen Level 1–3 erhalten. Bei Mixed-Gruppen werden gemeinsame Bewegungsmuster mit unterschiedlichen Griffen, Lasten, Distanzen oder Wiederholungen bevorzugt.
                </p>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <h3 className="text-lg font-black">Entwurf prüfen</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Diese Parameter gehen später an Suche, Regelprüfung und AI Composer.</p>

              <dl className="mt-5 divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)]">
                {[
                  ["Gruppe", `${selectedGroup?.[1] ?? groupType} · ${ageRange} · ${participantCount} Personen`],
                  ["Dauer", `${duration} Minuten`],
                  ["Ziele", goals.join(", ")],
                  ["Körperregionen", bodyRegions.length ? bodyRegions.join(", ") : "Keine Vorgabe"],
                  ["Formate", formats.join(", ")],
                  ["Ausrichtung", intensity],
                ].map(([label, value]) => (
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr]" key={label}>
                    <dt className="text-sm font-bold text-[var(--muted)]">{label}</dt>
                    <dd className="text-sm font-bold">{value}</dd>
                  </div>
                ))}
              </dl>

              {generated ? (
                <div className="mt-5 rounded-xl border border-[#b8d56c] bg-[#f0f7d7] p-4">
                  <div className="font-black">Wizard-Input steht.</div>
                  <p className="mt-1 text-sm leading-6 text-[#53622b]">
                    Die nächste Implementierungsstufe verbindet diese Daten mit Übungssuche, Vereinsregeln und dem AI Training Composer.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] p-5 sm:p-6">
          <button
            className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            disabled={step === 1}
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            type="button"
          >
            Zurück
          </button>
          {step < 5 ? (
            <button
              className="min-h-11 rounded-xl bg-[var(--dark)] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canContinue}
              onClick={() => setStep((current) => Math.min(5, current + 1))}
              type="button"
            >
              Weiter
            </button>
          ) : (
            <button
              className="min-h-11 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--dark)] hover:bg-[var(--accent-strong)]"
              onClick={() => setGenerated(true)}
              type="button"
            >
              Trainingsentwurf erstellen
            </button>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl bg-[var(--dark)] p-5 text-white">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">Live-Zusammenfassung</div>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-xs text-white/45">Gruppe</div>
              <div className="mt-1 font-black">{selectedGroup?.[1]} · {participantCount}</div>
            </div>
            <div>
              <div className="text-xs text-white/45">Zeit</div>
              <div className="mt-1 font-black">{duration} Minuten</div>
            </div>
            <div>
              <div className="text-xs text-white/45">Fokus</div>
              <div className="mt-1 text-sm font-bold leading-6">{goals.join(" · ") || "Noch auswählen"}</div>
            </div>
            <div>
              <div className="text-xs text-white/45">Format</div>
              <div className="mt-1 text-sm font-bold leading-6">{formats.join(" · ") || "Noch auswählen"}</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <div className="font-black">Planungsprinzip</div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Der Wizard legt Ziele und Rahmenbedingungen fest. Die eigentliche Session bleibt danach vollständig editierbar und wird immer in Aufwärmen, Hauptteil und Cooldown geprüft.
          </p>
        </section>
      </aside>
    </div>
  );
}
