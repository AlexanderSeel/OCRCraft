"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TrainingDraft } from "@/domain/training/draft";
import type { TrainingObstacleOption } from "@/server/training/training-draft-repository";
import { BodyFocusSelector } from "./body-focus-selector";
import {
  EquipmentAvailabilityPicker,
  type EquipmentAvailabilityOption,
} from "./equipment-availability-picker";
import {
  ExerciseAutocompletePicker,
  type SelectedExerciseReference,
} from "./exercise-autocomplete-picker";
import { ObstacleAvailabilityPicker } from "./obstacle-availability-picker";
import {
  persistTrainingDraft,
  requestTrainingDraft,
  type QuickCreateDraftClientInput,
} from "./quick-create-draft-client";
import { TrainingDraftPreview } from "./training-draft-preview";
import { Disclosure } from "@/components/ui/disclosure";

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

const DEFAULT_FORMATS: readonly string[] = ["rig-run"];

const locationOptions = [
  ["mixed", "Flexibel", "Indoor- und Outdoor-geeignete Übungen zulassen"],
  ["indoor", "Indoor", "Nur Übungen verwenden, die für Indoor-Training geeignet sind"],
  ["outdoor", "Outdoor", "Nur Übungen verwenden, die für Outdoor-Training geeignet sind"],
] as const;

export interface QuickCreateGroupPreset {
  readonly id: string;
  readonly name: string;
  readonly audience: "kids" | "youth" | "adults" | "mixed";
  readonly minAge: number | null;
  readonly maxAge: number | null;
  readonly participantCount: number;
  readonly durationMinutes: number | null;
  readonly defaultLocation: "indoor" | "outdoor" | "mixed";
  readonly defaultEquipment: readonly {
    readonly equipmentId: string;
    readonly quantityAvailable: number;
  }[];
  readonly skillDistribution: {
    readonly beginnerPercent: number;
    readonly intermediatePercent: number;
    readonly advancedPercent: number;
  } | null;
  readonly preferredFormats: readonly string[];
}

interface QuickCreateWizardProps {
  readonly equipmentOptions: readonly EquipmentAvailabilityOption[];
  readonly obstacleOptions?: readonly TrainingObstacleOption[];
  readonly groupPresets?: readonly QuickCreateGroupPreset[];
}

function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

function equipmentStateFromCatalog(
  equipmentOptions: readonly EquipmentAvailabilityOption[],
): Readonly<Record<string, string>> {
  return Object.fromEntries(equipmentOptions.flatMap((option) =>
    option.quantityAvailable == null ? [] : [[option.id, String(option.quantityAvailable)]]
  ));
}

function ageRangeForPreset(preset: QuickCreateGroupPreset): string {
  if (preset.minAge != null && preset.maxAge != null) {
    return preset.minAge === preset.maxAge
      ? String(preset.minAge)
      : `${preset.minAge}–${preset.maxAge}`;
  }
  if (preset.minAge != null) return `${preset.minAge}+`;
  if (preset.maxAge != null) return `bis ${preset.maxAge}`;
  return "Offen";
}

export function QuickCreateWizard({
  equipmentOptions,
  obstacleOptions = [],
  groupPresets = [],
}: QuickCreateWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupType, setGroupType] = useState("mixed");
  const [ageRange, setAgeRange] = useState("16+");
  const [participantCount, setParticipantCount] = useState(16);
  const [duration, setDuration] = useState(75);
  const [groupSplitCount, setGroupSplitCount] = useState<number | undefined>();
  const [goals, setGoals] = useState<readonly string[]>(["Ganzkörper", "OCR-Technik"]);
  const [bodyRegions, setBodyRegions] = useState<readonly string[]>(["forearms-grip", "core"]);
  const [avoidBodyRegions, setAvoidBodyRegions] = useState<readonly string[]>([]);
  const [preferredExercises, setPreferredExercises] = useState<readonly SelectedExerciseReference[]>([]);
  const [formats, setFormats] = useState<readonly string[]>(DEFAULT_FORMATS);
  const [location, setLocation] = useState("mixed");
  const [availableEquipment, setAvailableEquipment] = useState<Readonly<Record<string, string>>>(() =>
    equipmentStateFromCatalog(equipmentOptions),
  );
  const [obstacleInventoryDeclared, setObstacleInventoryDeclared] = useState(false);
  const [availableObstacleExerciseIds, setAvailableObstacleExerciseIds] = useState<readonly string[]>(() =>
    obstacleOptions.map((option) => option.id),
  );
  const [intensity, setIntensity] = useState("balanced");
  const [draft, setDraft] = useState<TrainingDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [persisting, setPersisting] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [persistedId, setPersistedId] = useState<string | null>(null);

  const selectedGroup = groupOptions.find(([id]) => id === groupType);
  const selectedPreset = groupPresets.find((preset) => preset.id === selectedGroupId);
  const selectedLocation = locationOptions.find(([id]) => id === location);
  const selectedObstacleNames = useMemo(
    () => obstacleOptions.filter((option) => availableObstacleExerciseIds.includes(option.id)).map((option) => option.name),
    [availableObstacleExerciseIds, obstacleOptions],
  );
  const durationOptions = useMemo(
    () => [...new Set([45, 60, 75, 90, 120, duration])].sort((a, b) => a - b),
    [duration],
  );
  const effectiveGroupSplitCount = groupSplitCount == null
    ? undefined
    : Math.max(1, Math.min(20, participantCount, groupSplitCount));
  const maxRotationGroupSize = effectiveGroupSplitCount == null
    ? undefined
    : Math.ceil(participantCount / effectiveGroupSplitCount);
  const canContinue = useMemo(() => {
    if (step === 2) return goals.length > 0;
    if (step === 3) return formats.length > 0;
    return true;
  }, [formats.length, goals.length, step]);

  function invalidateDraft() {
    setDraft(null);
    setGenerationError(null);
    setPersistenceError(null);
    setPersistedId(null);
  }

  function applyGroupPreset(groupId: string) {
    setSelectedGroupId(groupId);
    const preset = groupPresets.find((candidate) => candidate.id === groupId);
    if (!preset) {
      invalidateDraft();
      return;
    }

    setGroupType(preset.audience);
    setAgeRange(ageRangeForPreset(preset));
    setParticipantCount(preset.participantCount);
    if (preset.durationMinutes != null) setDuration(preset.durationMinutes);
    setLocation(preset.defaultLocation);
    setAvailableEquipment(
      preset.defaultEquipment.length > 0
        ? Object.fromEntries(preset.defaultEquipment.map((item) => [item.equipmentId, String(item.quantityAvailable)]))
        : equipmentStateFromCatalog(equipmentOptions),
    );
    setFormats(preset.preferredFormats.length > 0 ? preset.preferredFormats : DEFAULT_FORMATS);
    invalidateDraft();
  }

  function toggleFocusRegion(regionId: string) {
    const selecting = !bodyRegions.includes(regionId);
    setBodyRegions(toggleValue(bodyRegions, regionId));
    if (selecting) {
      setAvoidBodyRegions((current) => current.filter((id) => id !== regionId));
    }
    invalidateDraft();
  }

  function toggleAvoidRegion(regionId: string) {
    const selecting = !avoidBodyRegions.includes(regionId);
    setAvoidBodyRegions(toggleValue(avoidBodyRegions, regionId));
    if (selecting) {
      setBodyRegions((current) => current.filter((id) => id !== regionId));
    }
    invalidateDraft();
  }

  function currentDraftInput(): QuickCreateDraftClientInput {
    return {
      groupId: selectedGroupId || undefined,
      groupType,
      ageRange,
      participantCount,
      durationMinutes: duration,
      goals,
      bodyRegions,
      avoidBodyRegions,
      formats,
      location,
      organizationMode: "solo",
      groupSplitCount: effectiveGroupSplitCount,
      availableEquipment: Object.entries(availableEquipment).flatMap(([equipmentId, quantity]) =>
        quantity.trim() === "" ? [] : [{ equipmentId, quantityAvailable: Number(quantity) }]
      ),
      availableObstacleExerciseIds: obstacleInventoryDeclared ? availableObstacleExerciseIds : undefined,
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

              {groupPresets.length > 0 ? (
                <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                  <label className="grid gap-2 text-sm font-black">
                    Vereinsgruppe als Vorlage
                    <select
                      className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                      onChange={(event) => applyGroupPreset(event.target.value)}
                      value={selectedGroupId}
                    >
                      <option value="">Eigene Angaben</option>
                      {groupPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>{preset.name}</option>
                      ))}
                    </select>
                  </label>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                    Übernimmt Zielgruppe, Alter, Teilnehmerzahl, Standarddauer, Trainingsort und gruppenspezifische Equipment-Overrides. Die Werte bleiben danach frei anpassbar; beim Speichern bleibt das Training mit der Gruppe verknüpft.
                  </p>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {groupOptions.map(([id, label, description]) => (
                  <button
                    className={`min-h-28 rounded-xl border p-4 text-left transition ${
                      groupType === id
                        ? "border-[var(--control-strong)] bg-[var(--control-strong)] text-[var(--control-strong-foreground)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-subtle)]"
                    }`}
                    key={id}
                    onClick={() => {
                      setGroupType(id);
                      invalidateDraft();
                    }}
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
                    onChange={(event) => {
                      setAgeRange(event.target.value);
                      invalidateDraft();
                    }}
                    value={ageRange}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Teilnehmer
                  <input
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                    min={1}
                    onChange={(event) => {
                      setParticipantCount(Number(event.target.value));
                      invalidateDraft();
                    }}
                    type="number"
                    value={participantCount}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  Dauer
                  <select
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
                    onChange={(event) => {
                      setDuration(Number(event.target.value));
                      invalidateDraft();
                    }}
                    value={duration}
                  >
                    {durationOptions.map((minutes) => (
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
                    onClick={() => {
                      setGoals(toggleValue(goals, goal));
                      invalidateDraft();
                    }}
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
                    onToggle={toggleFocusRegion}
                    selected={bodyRegions}
                  />
                </div>
              </div>

              <Disclosure className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)]" summaryClassName="flex items-center justify-between gap-3 px-4 py-4 sm:px-5" summary={
                <>
                  <span>
                    <span className="font-black">Bereiche bewusst ausschließen</span>
                    <span className="ml-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]">
                      {avoidBodyRegions.length} ausgewählt
                    </span>
                    <span className="mt-1 block text-xs font-normal leading-5 text-[var(--muted)]">
                      Übungen mit diesen Körperregionen werden aus der deterministischen Planung ausgeschlossen.
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-lg font-black text-[var(--muted)]">+</span>
                </>
              }>
                <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                  <BodyFocusSelector
                    description="Wähle Bereiche, die diese Einheit bewusst nicht belasten soll. Wenn ein Bereich hier ausgewählt wird, wird er automatisch aus dem Trainingsfokus entfernt – und umgekehrt. Diese Einstellung ist eine Planungsregel des Trainers, keine medizinische Diagnose."
                    onToggle={toggleAvoidRegion}
                    selected={avoidBodyRegions}
                    title="Nicht belasten / vermeiden"
                    visualCompact
                  />
                </div>
              </Disclosure>

              <div className="mt-8 border-t border-[var(--border)] pt-6">
                <ExerciseAutocompletePicker
                  description="Optional: echte Übungen oder Hindernisse aus der Bibliothek vormerken. Namen, Aliase, Tags, Equipment und Körperregionen werden durchsucht."
                  label="Wunschübungen / Hindernisse"
                  onChange={(items) => {
                    setPreferredExercises(items);
                    invalidateDraft();
                  }}
                  selected={preferredExercises}
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h3 className="text-lg font-black">Wie und wo soll trainiert werden?</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Formate lassen sich kombinieren. Ort, Rotationsgruppen, Equipment und optional der reale Hindernisbestand begrenzen die praktische Planung.</p>

              <div className="mt-5">
                <div className="text-sm font-black">Trainingsort</div>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {locationOptions.map(([id, label, description]) => (
                    <button
                      aria-pressed={location === id}
                      className={`rounded-xl border p-4 text-left ${
                        location === id
                          ? "border-[var(--control-strong)] bg-[var(--control-strong)] text-[var(--control-strong-foreground)]"
                          : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)]"
                      }`}
                      key={id}
                      onClick={() => {
                        setLocation(id);
                        invalidateDraft();
                      }}
                      type="button"
                    >
                      <span className="block font-black">{label}</span>
                      <span className={`mt-1 block text-sm leading-5 ${location === id ? "opacity-70" : "text-[var(--muted)]"}`}>
                        {description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7 border-t border-[var(--border)] pt-6">
                <div className="text-sm font-black">Trainingsformat</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {formatOptions.map(([id, label, description]) => (
                    <button
                      aria-pressed={formats.includes(id)}
                      className={`rounded-xl border p-4 text-left ${
                        formats.includes(id)
                          ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]"
                          : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)]"
                      }`}
                      key={id}
                      onClick={() => {
                        setFormats(toggleValue(formats, id));
                        invalidateDraft();
                      }}
                      type="button"
                    >
                      <span className="block font-black">{label}</span>
                      <span className="mt-1 block text-sm leading-5 text-[var(--muted)]">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                <label className="grid gap-2 text-sm font-black sm:max-w-xs">
                  Rotationsgruppen (optional)
                  <input
                    className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                    max={Math.min(20, Math.max(1, participantCount))}
                    min={1}
                    onChange={(event) => {
                      setGroupSplitCount(event.target.value === ""
                        ? undefined
                        : Math.max(1, Math.min(20, participantCount, Number(event.target.value) || 1)));
                      invalidateDraft();
                    }}
                    placeholder="Automatisch"
                    type="number"
                    value={groupSplitCount ?? ""}
                  />
                </label>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  Leer = automatische Verteilung auf die aktiven Stationen. Eine feste Zahl steuert Stationskapazität und parallelen Equipmentbedarf. {effectiveGroupSplitCount != null ? `Aktuell: ${effectiveGroupSplitCount} Gruppen mit bis zu ${maxRotationGroupSize} Personen.` : ""}
                </p>
              </div>

              <Disclosure className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" summaryClassName="text-sm font-black" summary="Verfügbare Ausrüstung für Zirkel prüfen">
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Leeres Feld bedeutet unbekannten Bestand; 0 bedeutet nicht vorhanden. Für Zirkel wird der Bedarf aller gleichzeitig belegten Stationen addiert.
                </p>
                <div className="mt-4">
                  <EquipmentAvailabilityPicker
                    onChange={(equipmentId, quantity) => {
                      setAvailableEquipment((current) => ({
                        ...current,
                        [equipmentId]: quantity,
                      }));
                      invalidateDraft();
                    }}
                    options={equipmentOptions}
                    value={availableEquipment}
                  />
                </div>
              </Disclosure>

              <Disclosure className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" open={obstacleInventoryDeclared} summaryClassName="text-sm font-black" summary="Verfügbare OCR-Hindernisse">
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Optionaler harter Filter für Rig, Wand, Netz, Traverse und andere strukturierte Hindernisstationen. Nicht markierte Hindernisse werden weder lokal noch per AI eingeplant.
                </p>
                <div className="mt-4">
                  <ObstacleAvailabilityPicker
                    declared={obstacleInventoryDeclared}
                    onDeclaredChange={(declared) => {
                      setObstacleInventoryDeclared(declared);
                      invalidateDraft();
                    }}
                    onSelectionChange={(ids) => {
                      setAvailableObstacleExerciseIds(ids);
                      invalidateDraft();
                    }}
                    options={obstacleOptions}
                    selectedIds={availableObstacleExerciseIds}
                  />
                </div>
              </Disclosure>
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
                    onClick={() => {
                      setIntensity(id);
                      invalidateDraft();
                    }}
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
                  ["Vereinsgruppe", selectedPreset?.name ?? "Keine feste Gruppe"],
                  ["Gruppe", `${selectedGroup?.[1] ?? groupType} · ${ageRange} · ${participantCount} Personen`],
                  ["Rotationsgruppen", effectiveGroupSplitCount != null
                    ? `${effectiveGroupSplitCount} Gruppen · bis zu ${maxRotationGroupSize} Personen/Gruppe`
                    : "Automatische Stationsverteilung"],
                  ["Dauer", `${duration} Minuten`],
                  ["Skill-Mix", selectedPreset?.skillDistribution
                    ? `${selectedPreset.skillDistribution.beginnerPercent}% Beginner · ${selectedPreset.skillDistribution.intermediatePercent}% Intermediate · ${selectedPreset.skillDistribution.advancedPercent}% Advanced`
                    : "Keine Gruppenverteilung hinterlegt"],
                  ["Ziele", goals.join(", ")],
                  ["Körperregionen", bodyRegions.length ? bodyRegions.join(", ") : "Keine Vorgabe"],
                  ["Nicht belasten", avoidBodyRegions.length ? avoidBodyRegions.join(", ") : "Keine Ausschlüsse"],
                  ["Wunschübungen", preferredExercises.length ? preferredExercises.map((item) => item.label).join(", ") : "Keine Vorgabe"],
                  ["Ort", selectedLocation?.[1] ?? location],
                  ["Formate", formats.join(", ")],
                  ["Hindernisse", obstacleInventoryDeclared
                    ? selectedObstacleNames.length > 0
                      ? `${selectedObstacleNames.length} verfügbar: ${selectedObstacleNames.join(", ")}`
                      : "Explizit keine Hindernisstation verfügbar"
                    : "Bestand nicht eingeschränkt"],
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
              <div className="mt-1 font-black">{selectedPreset?.name ?? selectedGroup?.[1]} · {participantCount}</div>
              {selectedPreset ? <div className="mt-1 text-xs text-[var(--sidebar-muted)]">{selectedGroup?.[1]} · {ageRange}</div> : null}
            </div>
            {effectiveGroupSplitCount != null ? (
              <div>
                <div className="text-xs text-[var(--sidebar-muted)]">Rotation</div>
                <div className="mt-1 text-sm font-bold leading-6">{effectiveGroupSplitCount} Gruppen · max. {maxRotationGroupSize} Personen</div>
              </div>
            ) : null}
            <div>
              <div className="text-xs text-[var(--sidebar-muted)]">Zeit</div>
              <div className="mt-1 font-black">{duration} Minuten</div>
            </div>
            <div>
              <div className="text-xs text-[var(--sidebar-muted)]">Ort</div>
              <div className="mt-1 font-black">{selectedLocation?.[1] ?? location}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--sidebar-muted)]">Fokus</div>
              <div className="mt-1 text-sm font-bold leading-6">{goals.join(" · ") || "Noch auswählen"}</div>
            </div>
            {avoidBodyRegions.length > 0 ? (
              <div>
                <div className="text-xs text-[var(--sidebar-muted)]">Nicht belasten</div>
                <div className="mt-1 text-sm font-bold leading-6">{avoidBodyRegions.join(" · ")}</div>
              </div>
            ) : null}
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
            {obstacleInventoryDeclared ? (
              <div>
                <div className="text-xs text-[var(--sidebar-muted)]">Hindernisbestand</div>
                <div className="mt-1 text-sm font-bold leading-6">
                  {selectedObstacleNames.length > 0 ? `${selectedObstacleNames.length} Stationen verfügbar` : "Keine Station verfügbar"}
                </div>
              </div>
            ) : null}
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
