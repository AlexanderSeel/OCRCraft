"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  exerciseTrainingGoalLabels,
  exerciseTrainingGoals,
  exerciseTypeLabels,
  exerciseTypes,
} from "@/domain/exercise/classification";
import { TRAINING_FORMATS, type TrainingFormat } from "@/domain/training/model";
import type { TrainingDraft } from "@/domain/training/draft";
import { BodyFocusSelector } from "./body-focus-selector";
import {
  EquipmentAvailabilityPicker,
  type EquipmentAvailabilityOption,
} from "./equipment-availability-picker";
import {
  persistTrainingDraft,
  requestTrainingDraft,
  type QuickCreateBuilderMode,
  type QuickCreateDraftClientInput,
} from "./quick-create-draft-client";
import { TrainingDraftPreview } from "./training-draft-preview";

const formatLabels: Readonly<Record<TrainingFormat, string>> = {
  free: "Frei",
  circuit: "Zirkel",
  tabata: "Tabata Style",
  amrap: "AMRAP",
  emom: "EMOM",
  "rig-run": "Rig & Run",
  "run-exercise": "Run + Exercise",
  technique: "Technik",
  relay: "Team / Relay",
};

interface TrainingBuilderPanelProps {
  readonly equipmentOptions: readonly EquipmentAvailabilityOption[];
}

function toggle(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function TrainingBuilderPanel({ equipmentOptions }: TrainingBuilderPanelProps) {
  const [builderMode, setBuilderMode] = useState<QuickCreateBuilderMode>("local");
  const [audience, setAudience] = useState("mixed");
  const [ageRange, setAgeRange] = useState("16+");
  const [participants, setParticipants] = useState(16);
  const [duration, setDuration] = useState(75);
  const [goals, setGoals] = useState<readonly string[]>(["OCR-Technik", "Kraftausdauer"]);
  const [bodyRegions, setBodyRegions] = useState<readonly string[]>(["forearms-grip", "core"]);
  const [avoidBodyRegions, setAvoidBodyRegions] = useState<readonly string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<readonly string[]>(["skill", "strength"]);
  const [formats, setFormats] = useState<readonly string[]>(["circuit"]);
  const [location, setLocation] = useState("mixed");
  const [intensity, setIntensity] = useState("balanced");
  const [availableEquipment, setAvailableEquipment] = useState<Readonly<Record<string, string>>>(() =>
    Object.fromEntries(equipmentOptions.flatMap((option) =>
      option.quantityAvailable == null ? [] : [[option.id, String(option.quantityAvailable)]]
    )),
  );
  const [draft, setDraft] = useState<TrainingDraft | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canGenerate = goals.length > 0 && formats.length > 0;
  const selectedGoalLabels = useMemo(() => new Set(goals), [goals]);

  function invalidate() {
    setDraft(null);
    setSavedId(null);
    setError(null);
  }

  function input(): QuickCreateDraftClientInput {
    return {
      groupType: audience,
      ageRange,
      participantCount: participants,
      durationMinutes: duration,
      goals,
      bodyRegions,
      avoidBodyRegions,
      exerciseTypes: selectedTypes,
      formats,
      location,
      intensity,
      builderMode,
      preferredExerciseIds: [],
      availableEquipment: Object.entries(availableEquipment).flatMap(([equipmentId, quantity]) =>
        quantity.trim() === "" ? [] : [{ equipmentId, quantityAvailable: Number(quantity) }]
      ),
    };
  }

  async function generate() {
    setPending(true);
    setError(null);
    setSavedId(null);
    try {
      setDraft(await requestTrainingDraft(input()));
    } catch (cause) {
      setDraft(null);
      setError(cause instanceof Error ? cause.message : "Trainingsentwurf konnte nicht erstellt werden.");
    } finally {
      setPending(false);
    }
  }

  async function save() {
    if (!draft) return;
    setPending(true);
    setError(null);
    try {
      const result = await persistTrainingDraft(input(), title, draft);
      setDraft(result.draft);
      setSavedId(result.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Training konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-black">Planungsengine</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {([
              ["local", "Lokaler Sportalgorithmus", "Deterministisch, offline und reproduzierbar. Gewichtet Trainingslehre, Ziele, Muskeln, Typen, Belastung und Vielfalt."],
              ["ai", "AI-Vorschlag", "Nutzt nur freigegebene OCRCraft-Übungen. Der Vorschlag wird anschließend mit denselben deterministischen Regeln validiert."],
            ] as const).map(([id, label, description]) => (
              <button
                aria-pressed={builderMode === id}
                className={`rounded-xl border p-4 text-left ${builderMode === id ? "border-[var(--control-strong)] bg-[var(--control-strong)] text-[var(--control-strong-foreground)]" : "border-[var(--border)] bg-[var(--surface-subtle)]"}`}
                key={id}
                onClick={() => { setBuilderMode(id); invalidate(); }}
                type="button"
              >
                <span className="block font-black">{label}</span>
                <span className={`mt-1 block text-sm leading-5 ${builderMode === id ? "opacity-75" : "text-[var(--muted)]"}`}>{description}</span>
              </button>
            ))}
          </div>
          {builderMode === "ai" ? (
            <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-xs leading-5 text-[var(--muted)]">
              AI muss serverseitig konfiguriert sein. Sie darf keine neuen Übungs-IDs erfinden und kann Alters-, Orts-, Ausschluss-, Equipment- oder Sicherheitsfilter nicht umgehen.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-black">Gruppe & Rahmen</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Zielgruppe">
              <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" onChange={(e) => { setAudience(e.target.value); invalidate(); }} value={audience}>
                <option value="kids">Kids</option><option value="youth">Jugend</option><option value="adults">Erwachsene</option><option value="mixed">Mixed</option>
              </select>
            </Field>
            <Field label="Alter"><input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" onChange={(e) => { setAgeRange(e.target.value); invalidate(); }} value={ageRange} /></Field>
            <Field label="Teilnehmer"><input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" min={1} onChange={(e) => { setParticipants(Number(e.target.value)); invalidate(); }} type="number" value={participants} /></Field>
            <Field label="Dauer"><input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" min={30} max={180} onChange={(e) => { setDuration(Number(e.target.value)); invalidate(); }} type="number" value={duration} /></Field>
            <Field label="Ort"><select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" onChange={(e) => { setLocation(e.target.value); invalidate(); }} value={location}><option value="mixed">Flexibel</option><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option></select></Field>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-black">Ziele & Übungstypen</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {exerciseTrainingGoals.map((goal) => {
              const label = exerciseTrainingGoalLabels[goal].de;
              return <Toggle key={goal} active={selectedGoalLabels.has(label)} onClick={() => { setGoals(toggle(goals, label)); invalidate(); }}>{label}</Toggle>;
            })}
          </div>
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <div className="text-sm font-black">Bevorzugte Übungstypen</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {exerciseTypes.map((type) => <Toggle key={type} active={selectedTypes.includes(type)} onClick={() => { setSelectedTypes(toggle(selectedTypes, type)); invalidate(); }}>{exerciseTypeLabels[type]}</Toggle>)}
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">Typen sind eine starke Präferenz; wenn der freigegebene Pool keine sinnvolle Kombination erlaubt, erzeugt die Engine eine Warnung statt Sicherheitsregeln zu brechen.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <BodyFocusSelector selected={bodyRegions} onToggle={(id) => { setBodyRegions(toggle(bodyRegions, id)); setAvoidBodyRegions((current) => current.filter((entry) => entry !== id)); invalidate(); }} />
          <details className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <summary className="cursor-pointer font-black">Nicht belasten / vermeiden ({avoidBodyRegions.length})</summary>
            <div className="mt-4"><BodyFocusSelector visualCompact selected={avoidBodyRegions} title="Ausgeschlossene Bereiche" description="Übungen, die diese Bereiche belasten, werden ausgeschlossen." onToggle={(id) => { setAvoidBodyRegions(toggle(avoidBodyRegions, id)); setBodyRegions((current) => current.filter((entry) => entry !== id)); invalidate(); }} /></div>
          </details>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-black">Format & Belastung</h2>
          <div className="mt-3 flex flex-wrap gap-2">{TRAINING_FORMATS.filter((format) => format !== "free").map((format) => <Toggle key={format} active={formats.includes(format)} onClick={() => { setFormats(toggle(formats, format)); invalidate(); }}>{formatLabels[format]}</Toggle>)}</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {([ ["technique", "Technik"], ["balanced", "Ausgewogen"], ["conditioning", "Conditioning"] ] as const).map(([id, label]) => <Toggle key={id} active={intensity === id} onClick={() => { setIntensity(id); invalidate(); }}>{label}</Toggle>)}
          </div>
          <details className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <summary className="cursor-pointer font-black">Equipment-Bestand</summary>
            <div className="mt-4"><EquipmentAvailabilityPicker options={equipmentOptions} value={availableEquipment} onChange={(id, value) => { setAvailableEquipment((current) => ({ ...current, [id]: value })); invalidate(); }} /></div>
          </details>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-64 flex-1 gap-2 text-sm font-bold">Trainingstitel<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" value={title} /></label>
            <button className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] disabled:opacity-50" disabled={!canGenerate || pending} onClick={() => void generate()} type="button">{pending ? "Plane …" : builderMode === "ai" ? "AI-Vorschlag erzeugen" : "Lokal planen"}</button>
            <button className="min-h-11 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-foreground)] disabled:opacity-50" disabled={!draft || pending} onClick={() => void save()} type="button">Training speichern</button>
          </div>
          {error ? <div className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger)]">{error}</div> : null}
          {savedId ? <div className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm font-bold"><Link className="underline underline-offset-4" href={`/training/${savedId}`}>Gespeichertes Training öffnen</Link></div> : null}
          {draft ? <TrainingDraftPreview draft={draft} /> : null}
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] xl:sticky xl:top-4">
        <h2 className="font-black">Sportlogik</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
          <li>Warm-up, Hauptteil und Cooldown mit exakter Zeitverteilung.</li>
          <li>Technik/Koordination vor unnötiger Ermüdung; Belastung passend zur Ausrichtung.</li>
          <li>Abdeckung gewünschter Muskeln bei gleichzeitiger Bewegungs- und Körperregionsvielfalt.</li>
          <li>Alter, Ort, Ausschlussbereiche, Risiko, Equipment und Stationskapazität als harte Grenzen.</li>
          <li>Level-Varianten aus dem freigegebenen Übungskatalog statt erfundener Übungen.</li>
          <li>AI darf auswählen und begründen, aber niemals die deterministische Sicherheitsprüfung umgehen.</li>
        </ul>
      </aside>
    </div>
  );
}

function Field({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold">{label}{children}</label>;
}

function Toggle({ active, onClick, children }: { readonly active: boolean; readonly onClick: () => void; readonly children: React.ReactNode }) {
  return <button aria-pressed={active} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold ${active ? "border-[var(--control-strong)] bg-[var(--control-strong)] text-[var(--control-strong-foreground)]" : "border-[var(--border)] bg-[var(--surface-subtle)]"}`} onClick={onClick} type="button">{children}</button>;
}
