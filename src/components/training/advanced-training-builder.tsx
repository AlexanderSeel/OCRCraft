"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  exerciseTypeLabels,
  exerciseTypes,
} from "@/domain/exercise/classification";
import type { TrainingDraft } from "@/domain/training/draft";
import type { TrainingPhaseKind } from "@/domain/training/model";
import { BodyFocusSelector } from "./body-focus-selector";
import {
  EquipmentAvailabilityPicker,
  type EquipmentAvailabilityOption,
} from "./equipment-availability-picker";
import {
  persistTrainingDraft,
  regenerateTrainingDraftPhase,
  replaceTrainingDraftExercise,
  requestTrainingDraft,
  type DraftAlternativeMode,
  type QuickCreateBuilderMode,
  type QuickCreateDraftClientInput,
} from "./quick-create-draft-client";
import { TrainingDraftPreview } from "./training-draft-preview";

const GOALS = [
  "Ganzkörper",
  "OCR-Technik",
  "Grip",
  "Kraft",
  "Kraftausdauer",
  "Ausdauer",
  "Laufen",
  "Schnelligkeit",
  "Core",
  "Balance",
  "Koordination",
  "Mobility",
  "Teamwork",
] as const;

const FORMATS = [
  ["circuit", "Zirkel"],
  ["rig-run", "Rig & Run"],
  ["run-exercise", "Run + Exercise"],
  ["amrap", "AMRAP"],
  ["emom", "EMOM"],
  ["tabata", "Tabata"],
  ["technique", "Technik"],
  ["relay", "Team / Relay"],
] as const;

interface AdvancedTrainingBuilderProps {
  readonly aiAvailable: boolean;
  readonly equipmentOptions: readonly EquipmentAvailabilityOption[];
}

export function AdvancedTrainingBuilder({ aiAvailable, equipmentOptions }: AdvancedTrainingBuilderProps) {
  const [builderMode, setBuilderMode] = useState<QuickCreateBuilderMode>("local");
  const [groupType, setGroupType] = useState("adults");
  const [ageRange, setAgeRange] = useState("16+");
  const [participantCount, setParticipantCount] = useState(12);
  const [durationMinutes, setDurationMinutes] = useState(75);
  const [goals, setGoals] = useState<readonly string[]>(["Ganzkörper", "OCR-Technik"]);
  const [exerciseTypeSelection, setExerciseTypeSelection] = useState<readonly string[]>([]);
  const [bodyRegions, setBodyRegions] = useState<readonly string[]>([]);
  const [avoidBodyRegions, setAvoidBodyRegions] = useState<readonly string[]>([]);
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
  const [generating, setGenerating] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [regeneratingPhase, setRegeneratingPhase] = useState<TrainingPhaseKind | null>(null);
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const equipment = useMemo(
    () => Object.entries(availableEquipment).flatMap(([equipmentId, quantity]) => {
      if (quantity.trim() === "") return [];
      const parsed = Number(quantity);
      return Number.isInteger(parsed) && parsed >= 0 ? [{ equipmentId, quantityAvailable: parsed }] : [];
    }),
    [availableEquipment],
  );

  function invalidateDraft() {
    setDraft(null);
    setSavedId(null);
    setMessage(null);
  }

  function toggle(values: readonly string[], value: string): string[] {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  }

  function toggleFocus(regionId: string) {
    const selecting = !bodyRegions.includes(regionId);
    setBodyRegions(toggle(bodyRegions, regionId));
    if (selecting) setAvoidBodyRegions((current) => current.filter((id) => id !== regionId));
    invalidateDraft();
  }

  function toggleAvoid(regionId: string) {
    const selecting = !avoidBodyRegions.includes(regionId);
    setAvoidBodyRegions(toggle(avoidBodyRegions, regionId));
    if (selecting) setBodyRegions((current) => current.filter((id) => id !== regionId));
    invalidateDraft();
  }

  function input(): QuickCreateDraftClientInput {
    return {
      groupType,
      ageRange,
      participantCount,
      durationMinutes,
      goals,
      bodyRegions,
      avoidBodyRegions,
      exerciseTypes: exerciseTypeSelection,
      formats,
      location,
      intensity,
      builderMode,
      preferredExerciseIds: [],
      availableEquipment: equipment,
    };
  }

  async function generate() {
    setGenerating(true);
    setMessage(null);
    setSavedId(null);
    try {
      setDraft(await requestTrainingDraft(input()));
    } catch (error) {
      setDraft(null);
      setMessage(error instanceof Error ? error.message : "Training konnte nicht erstellt werden.");
    } finally {
      setGenerating(false);
    }
  }

  async function regeneratePhase(phase: TrainingPhaseKind) {
    if (!draft) return;
    setRegeneratingPhase(phase);
    setMessage(null);
    try {
      setDraft(await regenerateTrainingDraftPhase(input(), draft, phase));
      setSavedId(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Phase konnte nicht neu geplant werden.");
    } finally {
      setRegeneratingPhase(null);
    }
  }

  async function replaceExercise(exerciseId: string, mode: DraftAlternativeMode) {
    if (!draft) return;
    setReplacingExerciseId(exerciseId);
    setMessage(null);
    try {
      setDraft(await replaceTrainingDraftExercise(input(), draft, exerciseId, mode));
      setSavedId(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Alternative konnte nicht angewendet werden.");
    } finally {
      setReplacingExerciseId(null);
    }
  }

  async function save() {
    if (!draft) return;
    setPersisting(true);
    setMessage(null);
    try {
      const result = await persistTrainingDraft(input(), title, draft);
      setDraft(result.draft);
      setSavedId(result.id);
      setMessage("Training wurde gespeichert und serverseitig erneut validiert.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Training konnte nicht gespeichert werden.");
    } finally {
      setPersisting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="grid gap-3 lg:grid-cols-2">
          <ModeCard
            active={builderMode === "local"}
            description="Vollständig lokal und reproduzierbar. Bewertet Phase, Ziel, Muskel-/Bewegungsbalance, Belastungsreihenfolge, Risiko, Equipment und Wiederholungen aus letzten Trainings."
            label="Lokaler Sportalgorithmus"
            onClick={() => { setBuilderMode("local"); invalidateDraft(); }}
          />
          <ModeCard
            active={builderMode === "ai"}
            disabled={!aiAvailable}
            description={aiAvailable
              ? "AI wählt ausschließlich aus dem freigegebenen OCRCraft-Pool. Danach laufen dieselben deterministischen Sport-, Sicherheits- und Logistikprüfungen wie lokal."
              : "Nicht konfiguriert. OCRCRAFT_AI_BASE_URL und OCRCRAFT_AI_MODEL aktivieren einen OpenAI-kompatiblen Cloud- oder lokalen Provider."}
            label="AI Training Builder"
            onClick={() => { if (aiAvailable) { setBuilderMode("ai"); invalidateDraft(); } }}
          />
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-bold">
          Zielgruppe
          <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" value={groupType} onChange={(event) => { setGroupType(event.target.value); invalidateDraft(); }}>
            <option value="kids">Kids</option><option value="youth">Jugend</option><option value="adults">Erwachsene</option><option value="mixed">Mixed</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Alter
          <input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" value={ageRange} onChange={(event) => { setAgeRange(event.target.value); invalidateDraft(); }} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Teilnehmer
          <input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" min={1} max={200} type="number" value={participantCount} onChange={(event) => { setParticipantCount(Number(event.target.value)); invalidateDraft(); }} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Dauer
          <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" value={durationMinutes} onChange={(event) => { setDurationMinutes(Number(event.target.value)); invalidateDraft(); }}>
            {[45, 60, 75, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} Minuten</option>)}
          </select>
        </label>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-black">Trainingsziele & Übungstypen</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Der lokale Algorithmus bewertet diese Merkmale direkt; der AI-Modus erhält dieselben strukturierten Filter und den gleichen freigegebenen Pool.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {GOALS.map((goal) => <Toggle key={goal} active={goals.includes(goal)} label={goal} onClick={() => { setGoals(toggle(goals, goal)); invalidateDraft(); }} />)}
        </div>
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <div className="text-sm font-black">Bevorzugte Übungstypen</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {exerciseTypes.map((type) => <Toggle key={type} active={exerciseTypeSelection.includes(type)} label={exerciseTypeLabels[type]} onClick={() => { setExerciseTypeSelection(toggle(exerciseTypeSelection, type)); invalidateDraft(); }} />)}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <BodyFocusSelector selected={bodyRegions} onToggle={toggleFocus} title="Muskel-/Körperfokus" />
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <BodyFocusSelector
            selected={avoidBodyRegions}
            onToggle={toggleAvoid}
            title="Bewusst vermeiden"
            description="Übungen, die diese Regionen belasten, werden aus der Kandidatenauswahl ausgeschlossen."
          />
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] lg:grid-cols-3">
        <div>
          <div className="text-sm font-black">Formate</div>
          <div className="mt-3 flex flex-wrap gap-2">{FORMATS.map(([id, label]) => <Toggle key={id} active={formats.includes(id)} label={label} onClick={() => { setFormats(toggle(formats, id)); invalidateDraft(); }} />)}</div>
        </div>
        <label className="grid content-start gap-2 text-sm font-bold">
          Ort
          <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" value={location} onChange={(event) => { setLocation(event.target.value); invalidateDraft(); }}>
            <option value="mixed">Flexibel</option><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option>
          </select>
        </label>
        <label className="grid content-start gap-2 text-sm font-bold">
          Ausrichtung
          <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" value={intensity} onChange={(event) => { setIntensity(event.target.value); invalidateDraft(); }}>
            <option value="technique">Technik</option><option value="balanced">Ausgewogen</option><option value="conditioning">Conditioning</option>
          </select>
        </label>
      </section>

      <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <summary className="cursor-pointer font-black">Equipment-Bestand berücksichtigen</summary>
        <p className="mt-2 text-sm text-[var(--muted)]">0 bedeutet nicht verfügbar. Kandidaten mit nicht erfüllbarem deklariertem Equipment werden vor lokaler oder AI-Komposition herausgefiltert.</p>
        <div className="mt-4"><EquipmentAvailabilityPicker options={equipmentOptions} value={availableEquipment} onChange={(equipmentId, quantity) => { setAvailableEquipment((current) => ({ ...current, [equipmentId]: quantity })); invalidateDraft(); }} /></div>
      </details>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="grid min-w-[260px] flex-1 gap-2 text-sm font-bold">
            Trainingstitel
            <input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" maxLength={120} placeholder="Optional" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <button className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] disabled:opacity-50" disabled={generating || goals.length === 0 || formats.length === 0} onClick={() => void generate()} type="button">
            {generating ? "Plane Training …" : builderMode === "ai" ? "Mit AI planen" : "Lokal planen"}
          </button>
          <button className="min-h-11 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-foreground)] disabled:opacity-50" disabled={!draft || persisting} onClick={() => void save()} type="button">
            {persisting ? "Speichere …" : "Training speichern"}
          </button>
        </div>

        {message ? <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm font-semibold">{message}</div> : null}
        {savedId ? <Link className="mt-3 inline-flex text-sm font-black underline underline-offset-4" href={`/training/${savedId}`}>Gespeichertes Training öffnen</Link> : null}

        {draft ? (
          <TrainingDraftPreview
            draft={draft}
            onRegeneratePhase={(phase) => void regeneratePhase(phase)}
            regeneratingPhase={regeneratingPhase}
            onReplaceExercise={(exerciseId, mode) => void replaceExercise(exerciseId, mode)}
            replacingExerciseId={replacingExerciseId}
          />
        ) : null}
      </section>
    </div>
  );
}

function ModeCard({ active, disabled = false, label, description, onClick }: { readonly active: boolean; readonly disabled?: boolean; readonly label: string; readonly description: string; readonly onClick: () => void }) {
  return <button aria-pressed={active} className={`rounded-xl border p-4 text-left ${active ? "border-[var(--control-strong)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface-subtle)]"} disabled:cursor-not-allowed disabled:opacity-50`} disabled={disabled} onClick={onClick} type="button"><span className="block font-black">{label}</span><span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{description}</span></button>;
}

function Toggle({ active, label, onClick }: { readonly active: boolean; readonly label: string; readonly onClick: () => void }) {
  return <button aria-pressed={active} className={`min-h-10 rounded-lg border px-3 py-2 text-sm font-bold ${active ? "border-[var(--control-strong)] bg-[var(--control-strong)] text-[var(--control-strong-foreground)]" : "border-[var(--border)] bg-[var(--surface-subtle)]"}`} onClick={onClick} type="button">{label}</button>;
}
