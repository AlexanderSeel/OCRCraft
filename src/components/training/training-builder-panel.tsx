"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TrainingDraft } from "@/domain/training/draft";
import { TEAM_COMPETITION_STYLES, getTeamCompetitionStyle } from "@/domain/training/team-competition-catalog";
import {
  exerciseTrainingGoalLabels,
  exerciseTrainingGoals,
  exerciseTypeLabels,
  exerciseTypes,
} from "@/domain/exercise/classification";
import {
  TRAINING_FORMATS,
  type MainPartProgramming,
  type TrainingFormat,
  type TrainingPhaseKind,
} from "@/domain/training/model";
import { BodyFocusSelector } from "./body-focus-selector";
import {
  EquipmentAvailabilityPicker,
  type EquipmentAvailabilityOption,
} from "./equipment-availability-picker";
import {
  ExerciseAutocompletePicker,
  type SelectedExerciseReference,
} from "./exercise-autocomplete-picker";
import { MainPartProgrammingEditor } from "./main-part-programming-editor";
import { Disclosure } from "@/components/ui/disclosure";
import { useToast } from "@/components/ui/toast";
import { ObstacleAvailabilityPicker } from "./obstacle-availability-picker";
import type { TrainingObstacleOption } from "@/server/training/training-draft-catalog-core";
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
  partner: "Partner Workout",
  "team-competition": "Teamwettkampf",
};

export interface TrainingBuilderSourceOption {
  readonly id: string;
  readonly title: string;
  readonly totalDurationMinutes: number;
  readonly itemCount: number;
}

export interface TrainingBuilderInitialState {
  readonly sourceTrainingId: string;
  readonly sourceTitle: string;
  readonly groupId?: string;
  readonly builderMode: QuickCreateBuilderMode;
  readonly audience: string;
  readonly minAge?: number;
  readonly maxAge?: number;
  readonly participantCount: number;
  readonly durationMinutes: number;
  readonly goals: readonly string[];
  readonly bodyRegions: readonly string[];
  readonly avoidBodyRegions: readonly string[];
  readonly exerciseTypes: readonly string[];
  readonly formats: readonly string[];
  readonly location: string;
  readonly intensity: string;
  readonly warmupExerciseCount?: number;
  readonly mainExerciseCount?: number;
  readonly mainPartExerciseCounts?: readonly number[];
  readonly mainPartProgramming?: readonly MainPartProgramming[];
  readonly cooldownExerciseCount?: number;
  readonly mainPartCount?: number;
  readonly organizationMode?: "solo" | "team";
  readonly teamSize?: number;
  readonly groupSplitCount?: number;
  readonly sourceTrainingIds?: readonly string[];
  readonly preferredExercises: readonly SelectedExerciseReference[];
  readonly availableEquipment: readonly {
    readonly equipmentId: string;
    readonly quantityAvailable: number;
  }[];
  readonly availableObstacleExerciseIds?: readonly string[];
}

interface TrainingBuilderPanelProps {
  readonly equipmentOptions: readonly EquipmentAvailabilityOption[];
  readonly obstacleOptions?: readonly TrainingObstacleOption[];
  readonly sourceTrainingOptions?: readonly TrainingBuilderSourceOption[];
  readonly initialState?: TrainingBuilderInitialState;
  readonly initialBuilderMode?: QuickCreateBuilderMode;
}

function toggle(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function formatAgeRange(minAge?: number, maxAge?: number): string {
  if (minAge != null && maxAge != null) return minAge === maxAge ? String(minAge) : `${minAge}–${maxAge}`;
  if (minAge != null) return `${minAge}+`;
  if (maxAge != null) return `bis ${maxAge}`;
  return "Offen";
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function initialMainPartCounts(initialState?: TrainingBuilderInitialState): readonly number[] {
  const count = clampInteger(initialState?.mainPartCount ?? 1, 1, 4);
  const fallback = clampInteger(initialState?.mainExerciseCount ?? 4, 1, 8);
  if (initialState?.mainPartExerciseCounts?.length === count) {
    return initialState.mainPartExerciseCounts.map((value) => clampInteger(value, 1, 8));
  }
  return Array.from({ length: count }, () => fallback);
}

function initialMainPartProgramming(initialState?: TrainingBuilderInitialState): readonly MainPartProgramming[] {
  const count = clampInteger(initialState?.mainPartCount ?? 1, 1, 4);
  if (initialState?.mainPartProgramming?.length === count) return initialState.mainPartProgramming;
  return Array.from({ length: count }, () => ({ mode: "standard" as const }));
}

export function TrainingBuilderPanel({
  equipmentOptions,
  obstacleOptions = [],
  sourceTrainingOptions = [],
  initialState,
  initialBuilderMode = "local",
}: TrainingBuilderPanelProps) {
  const { pushToast, updateToast } = useToast();
  const [builderMode, setBuilderMode] = useState<QuickCreateBuilderMode>(initialState?.builderMode ?? initialBuilderMode);
  const [audience, setAudience] = useState(initialState?.audience ?? "mixed");
  const [ageRange, setAgeRange] = useState(
    initialState ? formatAgeRange(initialState.minAge, initialState.maxAge) : "16+",
  );
  const [participants, setParticipants] = useState(initialState?.participantCount ?? 16);
  const [duration, setDuration] = useState(initialState?.durationMinutes ?? 75);
  const [goals, setGoals] = useState<readonly string[]>(initialState?.goals ?? ["OCR-Technik", "Kraftausdauer"]);
  const [bodyRegions, setBodyRegions] = useState<readonly string[]>(initialState?.bodyRegions ?? ["forearms-grip", "core"]);
  const [avoidBodyRegions, setAvoidBodyRegions] = useState<readonly string[]>(initialState?.avoidBodyRegions ?? []);
  const [selectedTypes, setSelectedTypes] = useState<readonly string[]>(initialState?.exerciseTypes ?? ["skill", "strength"]);
  const [sourceTrainingIds, setSourceTrainingIds] = useState<readonly string[]>(initialState?.sourceTrainingIds ?? []);
  const [preferredExercises, setPreferredExercises] = useState<readonly SelectedExerciseReference[]>(initialState?.preferredExercises ?? []);
  const [formats, setFormats] = useState<readonly string[]>(initialState?.formats ?? ["circuit"]);
  const [competitionStyleKey, setCompetitionStyleKey] = useState("");
  const [location, setLocation] = useState(initialState?.location ?? "mixed");
  const [intensity, setIntensity] = useState(initialState?.intensity ?? "balanced");
  const [warmupExerciseCount, setWarmupExerciseCount] = useState(initialState?.warmupExerciseCount ?? 2);
  const [mainPartExerciseCounts, setMainPartExerciseCounts] = useState<readonly number[]>(() => initialMainPartCounts(initialState));
  const [mainPartProgramming, setMainPartProgramming] = useState<readonly MainPartProgramming[]>(() => initialMainPartProgramming(initialState));
  const [cooldownExerciseCount, setCooldownExerciseCount] = useState(initialState?.cooldownExerciseCount ?? 2);
  const [mainPartCount, setMainPartCountState] = useState(initialState?.mainPartCount ?? 1);
  const [organizationMode, setOrganizationMode] = useState<"solo" | "team">(initialState?.organizationMode ?? "solo");
  const [teamSize, setTeamSize] = useState(initialState?.teamSize ?? 4);
  const [groupSplitCount, setGroupSplitCount] = useState<number | undefined>(initialState?.groupSplitCount);
  const [availableEquipment, setAvailableEquipment] = useState<Readonly<Record<string, string>>>(() =>
    initialState
      ? Object.fromEntries(initialState.availableEquipment.map((item) => [item.equipmentId, String(item.quantityAvailable)]))
      : Object.fromEntries(equipmentOptions.flatMap((option) =>
          option.quantityAvailable == null ? [] : [[option.id, String(option.quantityAvailable)]]
        )),
  );
  const [obstacleInventoryDeclared, setObstacleInventoryDeclared] = useState(initialState?.availableObstacleExerciseIds != null);
  const [availableObstacleExerciseIds, setAvailableObstacleExerciseIds] = useState<readonly string[]>(() =>
    initialState?.availableObstacleExerciseIds ?? obstacleOptions.map((option) => option.id),
  );
  const [draft, setDraft] = useState<TrainingDraft | null>(null);
  const [undoDrafts, setUndoDrafts] = useState<readonly TrainingDraft[]>([]);
  const [redoDrafts, setRedoDrafts] = useState<readonly TrainingDraft[]>([]);
  const [title, setTitle] = useState(initialState ? `${initialState.sourceTitle} – angepasst` : "");
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [regeneratingPhase, setRegeneratingPhase] = useState<TrainingPhaseKind | null>(null);
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null);

  const canGenerate = goals.length > 0
    && formats.length > 0
    && (!formats.includes("team-competition") || competitionStyleKey.length > 0);
  const selectedGoalLabels = useMemo(() => new Set(goals), [goals]);
  const partnerWorkout = formats.includes("partner");
  const effectiveOrganizationMode: "solo" | "team" = partnerWorkout ? "team" : organizationMode;
  const effectiveTeamSize = partnerWorkout
    ? 2
    : effectiveOrganizationMode === "team"
      ? clampInteger(teamSize, 2, Math.min(20, Math.max(2, participants)))
      : undefined;
  const effectiveGroupSplitCount = effectiveOrganizationMode === "solo" && groupSplitCount != null
    ? clampInteger(groupSplitCount, 1, Math.min(20, Math.max(1, participants)))
    : undefined;
  const totalRequestedExercises = warmupExerciseCount
    + cooldownExerciseCount
    + mainPartExerciseCounts.reduce((sum, count) => sum + count, 0);

  function invalidate() {
    setDraft(null);
    setUndoDrafts([]);
    setRedoDrafts([]);
    setSavedId(null);
    setError(null);
  }

  function commitDraft(nextDraft: TrainingDraft) {
    if (draft) setUndoDrafts((current) => [...current, draft].slice(-20));
    setRedoDrafts([]);
    setDraft(nextDraft);
  }

  function undoDraft() {
    if (!draft || undoDrafts.length === 0) return;
    const previous = undoDrafts[undoDrafts.length - 1];
    setUndoDrafts((current) => current.slice(0, -1));
    setRedoDrafts((current) => [...current, draft].slice(-20));
    setDraft(previous);
    setSavedId(null);
    pushToast({ tone: "info", title: "Änderung rückgängig gemacht" });
  }

  function redoDraft() {
    if (!draft || redoDrafts.length === 0) return;
    const next = redoDrafts[redoDrafts.length - 1];
    setRedoDrafts((current) => current.slice(0, -1));
    setUndoDrafts((current) => [...current, draft].slice(-20));
    setDraft(next);
    setSavedId(null);
    pushToast({ tone: "info", title: "Änderung wiederhergestellt" });
  }

  function updateMainPartCount(value: number) {
    const nextCount = clampInteger(value, 1, 4);
    setMainPartCountState(nextCount);
    setMainPartExerciseCounts((current) => Array.from(
      { length: nextCount },
      (_, index) => current[index] ?? current.at(-1) ?? 4,
    ));
    setMainPartProgramming((current) => Array.from(
      { length: nextCount },
      (_, index) => current[index] ?? { mode: "standard" },
    ));
    invalidate();
  }

  function updateMainPartExerciseCount(index: number, value: number) {
    setMainPartExerciseCounts((current) => current.map((count, candidateIndex) =>
      candidateIndex === index ? clampInteger(value, 1, 8) : count
    ));
    invalidate();
  }

  function updateMainPartProgramming(index: number, value: MainPartProgramming) {
    setMainPartProgramming((current) => current.map((programming, candidateIndex) =>
      candidateIndex === index ? value : programming
    ));
    invalidate();
  }

  function toggleSourceTraining(id: string) {
    setSourceTrainingIds((current) => {
      if (current.includes(id)) return current.filter((entry) => entry !== id);
      if (current.length >= 6) return current;
      return [...current, id];
    });
    invalidate();
  }

  function applyCompetitionStyle(key: string) {
    setCompetitionStyleKey(key);
    const style = getTeamCompetitionStyle(key);
    if (!style) {
      invalidate();
      return;
    }
    setFormats(style.formats);
    setGoals(style.goals);
    setIntensity(style.intensity);
    setOrganizationMode("team");
    setTeamSize(style.teamSize);
    setGroupSplitCount(undefined);
    setMainPartCountState(style.mainPartTitlesDe.length);
    setMainPartExerciseCounts(style.mainPartExerciseCounts);
    setMainPartProgramming(style.mainPartProgramming);
    invalidate();
  }

  function input(): QuickCreateDraftClientInput {
    return {
      groupId: initialState?.groupId,
      competitionStyleKey: formats.includes("team-competition") ? competitionStyleKey || undefined : undefined,
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
      warmupExerciseCount,
      mainExerciseCount: mainPartExerciseCounts[0] ?? 4,
      mainPartExerciseCounts,
      mainPartProgramming,
      cooldownExerciseCount,
      mainPartCount,
      organizationMode: effectiveOrganizationMode,
      teamSize: effectiveTeamSize,
      groupSplitCount: effectiveGroupSplitCount,
      sourceTrainingIds: builderMode === "ai" ? sourceTrainingIds : [],
      preferredExerciseIds: preferredExercises.map((exercise) => exercise.id),
      availableEquipment: Object.entries(availableEquipment).flatMap(([equipmentId, quantity]) =>
        quantity.trim() === "" ? [] : [{ equipmentId, quantityAvailable: Number(quantity) }]
      ),
      availableObstacleExerciseIds: obstacleInventoryDeclared ? availableObstacleExerciseIds : undefined,
    };
  }

  async function generate() {
    const toastId = pushToast({ tone: "loading", title: "Training wird geplant" });
    setPending(true);
    setError(null);
    setSavedId(null);
    try {
      const nextDraft = await requestTrainingDraft(input());
      commitDraft(nextDraft);
      updateToast(toastId, { tone: "success", title: "Trainingsentwurf bereit", message: "Planung und Sicherheitsprüfung sind abgeschlossen." });
    } catch (cause) {
      setDraft(null);
      const message = cause instanceof Error ? cause.message : "Trainingsentwurf konnte nicht erstellt werden.";
      setError(message);
      updateToast(toastId, { tone: "error", title: "Planung fehlgeschlagen", message });
    } finally {
      setPending(false);
    }
  }

  async function regeneratePhase(phase: TrainingPhaseKind) {
    if (!draft) return;
    const toastId = pushToast({ tone: "loading", title: "Phase wird neu geplant" });
    setRegeneratingPhase(phase);
    setError(null);
    setSavedId(null);
    try {
      const nextDraft = await regenerateTrainingDraftPhase(input(), draft, phase);
      commitDraft(nextDraft);
      updateToast(toastId, { tone: "success", title: "Phase aktualisiert" });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Phase konnte nicht neu geplant werden.";
      setError(message);
      updateToast(toastId, { tone: "error", title: "Neuplanung fehlgeschlagen", message });
    } finally {
      setRegeneratingPhase(null);
    }
  }

  async function replaceExercise(exerciseId: string, mode: DraftAlternativeMode) {
    if (!draft) return;
    const toastId = pushToast({ tone: "loading", title: "Alternative wird gesucht" });
    setReplacingExerciseId(exerciseId);
    setError(null);
    setSavedId(null);
    try {
      const nextDraft = await replaceTrainingDraftExercise(input(), draft, exerciseId, mode);
      commitDraft(nextDraft);
      updateToast(toastId, { tone: "success", title: "Übung ersetzt" });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Keine passende Übungsalternative gefunden.";
      setError(message);
      updateToast(toastId, { tone: "error", title: "Keine Alternative angewendet", message });
    } finally {
      setReplacingExerciseId(null);
    }
  }

  async function save() {
    if (!draft) return;
    const toastId = pushToast({ tone: "loading", title: "Training wird gespeichert" });
    setPending(true);
    setError(null);
    try {
      const result = await persistTrainingDraft(input(), title, draft);
      setDraft(result.draft);
      setSavedId(result.id);
      updateToast(toastId, { tone: "success", title: "Training gespeichert" });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Training konnte nicht gespeichert werden.";
      setError(message);
      updateToast(toastId, { tone: "error", title: "Speichern fehlgeschlagen", message });
    } finally {
      setPending(false);
    }
  }

  const busy = pending || regeneratingPhase != null || replacingExerciseId != null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        {initialState ? (
          <section className="rounded-2xl border border-[var(--accent-strong)] bg-[var(--accent-soft)] p-5">
            <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Training anpassen / neu erzeugen</div>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-lg font-black">Basis: {initialState.sourceTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Die gespeicherten Builder-Parameter wurden geladen. Änderungen erzeugen einen neuen Entwurf; das Ursprungstraining bleibt unverändert.
                </p>
              </div>
              <Link className="text-sm font-black underline underline-offset-4" href={`/training/${initialState.sourceTrainingId}`}>
                Ursprung öffnen
              </Link>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-black">Planungsengine</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {([
              ["local", "Lokaler Sportalgorithmus", "Deterministisch und reproduzierbar. Gewichtet Trainingslehre, Ziele, Muskeln, Gegenmuskeln, Typen, Belastung, letzte Trainings und Vielfalt."],
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
            <div className="mt-3 space-y-3">
              <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-xs leading-5 text-[var(--muted)]">
                AI muss serverseitig konfiguriert sein. Sie darf keine neuen Übungs-IDs erfinden und kann Alters-, Orts-, Ausschluss-, Equipment-, Hindernis- oder Sicherheitsfilter nicht umgehen.
              </p>
              {sourceTrainingOptions.length > 0 ? (
                <Disclosure className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" summaryClassName="text-sm font-black" summary={`Frühere Trainings als Rekompositions-Kontext (${sourceTrainingIds.length}/6)`}>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                    Optional. Die AI darf Muster und Übungsauswahl aus bis zu sechs Einheiten als Inspiration verwenden. Aktuelle Ziele, Muskelwahl, Ausschlüsse, Equipment und Sicherheitsregeln bleiben maßgeblich.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {sourceTrainingOptions.map((option) => {
                      const active = sourceTrainingIds.includes(option.id);
                      const disabled = !active && sourceTrainingIds.length >= 6;
                      return (
                        <label className={`flex gap-3 rounded-lg border p-3 text-sm ${active ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface)]"} ${disabled ? "opacity-45" : ""}`} key={option.id}>
                          <input checked={active} disabled={disabled} onChange={() => toggleSourceTraining(option.id)} type="checkbox" />
                          <span>
                            <span className="block font-black">{option.title}</span>
                            <span className="mt-0.5 block text-xs text-[var(--muted)]">{option.totalDurationMinutes} Min. · {option.itemCount} Übungen</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </Disclosure>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-black">Gruppe & Rahmen</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Zielgruppe">
              <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" onChange={(event) => { setAudience(event.target.value); invalidate(); }} value={audience}>
                <option value="kids">Kids</option>
                <option value="youth">Jugend</option>
                <option value="adults">Erwachsene</option>
                <option value="mixed">Mixed</option>
              </select>
            </Field>
            <Field label="Alter"><input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" onChange={(event) => { setAgeRange(event.target.value); invalidate(); }} value={ageRange} /></Field>
            <Field label="Teilnehmer"><input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" min={1} max={200} onChange={(event) => { setParticipants(clampInteger(Number(event.target.value), 1, 200)); invalidate(); }} type="number" value={participants} /></Field>
            <Field label="Dauer"><input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" max={180} min={30} onChange={(event) => { setDuration(clampInteger(Number(event.target.value), 30, 180)); invalidate(); }} type="number" value={duration} /></Field>
            <Field label="Ort">
              <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" onChange={(event) => { setLocation(event.target.value); invalidate(); }} value={location}>
                <option value="mixed">Flexibel</option><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Trainingsstruktur & Organisation</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Steuert die exakte Anzahl der Übungen, Rotationsgruppen und die konkrete Programmierung je Hauptteil. Mehrere Hauptteile werden als getrennte Blöcke geplant und gespeichert.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-black">
              {totalRequestedExercises} Übungen gesamt
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <NumberField label="Warm-up Übungen" value={warmupExerciseCount} min={1} max={6} onChange={(value) => { setWarmupExerciseCount(value); invalidate(); }} />
            <NumberField label="Hauptteile" value={mainPartCount} min={1} max={4} onChange={updateMainPartCount} />
            <NumberField label="Cooldown Übungen" value={cooldownExerciseCount} min={1} max={6} onChange={(value) => { setCooldownExerciseCount(value); invalidate(); }} />
          </div>

          <div className={`mt-4 grid gap-3 ${mainPartCount === 1 ? "sm:max-w-xs" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
            {mainPartExerciseCounts.map((count, index) => (
              <NumberField
                key={index}
                label={mainPartCount === 1 ? "Übungen Hauptteil" : `Übungen Hauptteil ${index + 1}`}
                value={count}
                min={1}
                max={8}
                onChange={(value) => updateMainPartExerciseCount(index, value)}
              />
            ))}
          </div>

          <Disclosure className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4" open={mainPartProgramming.some((item) => item.mode !== "standard")} summaryClassName="font-black" summary="Programmierung je Hauptteil">
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
              Optional. Intervall, feste Runden, Ladder, Pyramide, Chipper und Every-X werden als strukturierte Prescription gespeichert und bleiben bei AI-Neuplanung oder Übungsersatz erhalten.
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {mainPartProgramming.map((programming, index) => (
                <MainPartProgrammingEditor
                  index={index}
                  key={index}
                  onChange={(value) => updateMainPartProgramming(index, value)}
                  partnerWorkout={partnerWorkout}
                  value={programming}
                />
              ))}
            </div>
          </Disclosure>

          <div className="mt-5 grid gap-4 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
            <Field label="Organisation im Hauptteil">
              <select
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"
                onChange={(event) => { setOrganizationMode(event.target.value === "team" ? "team" : "solo"); invalidate(); }}
                value={organizationMode}
              >
                <option value="solo">Alleine / individuelle Rotation</option>
                <option value="team">Teams</option>
              </select>
            </Field>
            {organizationMode === "team" ? (
              <NumberField
                label="Teamgröße"
                value={effectiveTeamSize ?? 2}
                min={2}
                max={Math.min(20, Math.max(2, participants))}
                onChange={(value) => { setTeamSize(value); invalidate(); }}
              />
            ) : (
              <Field label="Rotationsgruppen (optional)">
                <input
                  className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                  max={Math.min(20, Math.max(1, participants))}
                  min={1}
                  onChange={(event) => {
                    setGroupSplitCount(event.target.value === "" ? undefined : clampInteger(Number(event.target.value), 1, Math.min(20, Math.max(1, participants))));
                    invalidate();
                  }}
                  placeholder="Automatisch"
                  type="number"
                  value={groupSplitCount ?? ""}
                />
              </Field>
            )}
          </div>
          {organizationMode === "team" ? (
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
              Der lokale Planer bevorzugt bei Teamtraining Teamwork-/Drill-Übungen und berücksichtigt die Teamgröße bei Stationskapazität und gleichzeitigem Equipmentbedarf. Die AI erhält dieselben Werte als verbindliche Strukturvorgabe.
            </p>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
              Leer = automatische Verteilung über die aktiven Stationen. Mit einer festen Zahl, z. B. 4 Gruppen bei 20 Personen, prüft OCRCraft mit bis zu 5 Personen je Rotationsgruppe und berechnet parallelen Equipmentbedarf entsprechend.
            </p>
          )}
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
          <Disclosure className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" summaryClassName="font-black" summary={`Nicht belasten / vermeiden (${avoidBodyRegions.length})`}>
            <div className="mt-4">
              <BodyFocusSelector description="Übungen, die diese Bereiche belasten, werden ausgeschlossen." onToggle={(id) => { setAvoidBodyRegions(toggle(avoidBodyRegions, id)); setBodyRegions((current) => current.filter((entry) => entry !== id)); invalidate(); }} selected={avoidBodyRegions} title="Ausgeschlossene Bereiche" visualCompact />
            </div>
          </Disclosure>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-black">Wunschübungen & Hindernisse</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Optional als starke Trainerpräferenz. Beide Engines versuchen diese Übungen einzubauen, solange Phase, Alter, Ausschlüsse, Hindernisbestand und Sicherheitsregeln passen.</p>
          <div className="mt-4">
            <ExerciseAutocompletePicker description="Durchsucht den freigegebenen Übungspool nach Namen, Aliasen und strukturierten Metadaten." label="Bevorzugte Übungen" maxItems={8} onChange={(items) => { setPreferredExercises(items); invalidate(); }} selected={preferredExercises} />
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-black">Format & Belastung</h2>
          <div className="mt-3 flex flex-wrap gap-2">{TRAINING_FORMATS.filter((format) => format !== "free").map((format) => <Toggle key={format} active={formats.includes(format)} onClick={() => {
            const selecting = !formats.includes(format);
            setFormats(toggle(formats, format));
            if (format === "partner" && selecting) {
              setOrganizationMode("team");
              setTeamSize(2);
              setGroupSplitCount(undefined);
            }
            if (format === "team-competition" && !selecting) setCompetitionStyleKey("");
            invalidate();
          }}>{formatLabels[format]}</Toggle>)}</div>
          {formats.includes("team-competition") ? (
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <label className="grid gap-2 text-sm font-black">
                Teamwettkampfstil
                <select
                  className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                  onChange={(event) => applyCompetitionStyle(event.target.value)}
                  value={competitionStyleKey}
                >
                  <option value="">Stil auswählen</option>
                  {TEAM_COMPETITION_STYLES.map((style) => (
                    <option key={style.key} value={style.key}>{style.titleDe} · {style.teamSize}er-Team</option>
                  ))}
                </select>
              </label>
              {getTeamCompetitionStyle(competitionStyleKey) ? (
                <div className="mt-3 text-xs leading-5 text-[var(--muted)]">
                  <p>{getTeamCompetitionStyle(competitionStyleKey)?.descriptionDe}</p>
                  <p className="mt-2 font-bold text-[var(--foreground)]">{getTeamCompetitionStyle(competitionStyleKey)?.mainPartTitlesDe.join(" → ")}</p>
                  <p className="mt-2">Nach dem Übernehmen bleiben Hauptteile, Runden und Belastungsparameter vollständig editierbar.</p>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">{([ ["technique", "Technik"], ["balanced", "Ausgewogen"], ["conditioning", "Conditioning"] ] as const).map(([id, label]) => <Toggle key={id} active={intensity === id} onClick={() => { setIntensity(id); invalidate(); }}>{label}</Toggle>)}</div>
          <Disclosure className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" summaryClassName="font-black" summary="Equipment-Bestand">
            <div className="mt-4"><EquipmentAvailabilityPicker defaultPortableOnly={location === "outdoor"} key={location === "outdoor" ? "outdoor-equipment" : "all-equipment"} onChange={(id, value) => { setAvailableEquipment((current) => ({ ...current, [id]: value })); invalidate(); }} options={equipmentOptions} value={availableEquipment} /></div>
          </Disclosure>
          <Disclosure className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" open={obstacleInventoryDeclared} summaryClassName="font-black" summary="OCR-Hindernisbestand">
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Wenn der Vereinsbestand aktiviert ist, werden nicht markierte Hindernisstationen hart aus lokaler und AI-Planung sowie aus späteren Übungsalternativen ausgeschlossen.</p>
            <div className="mt-4">
              <ObstacleAvailabilityPicker
                declared={obstacleInventoryDeclared}
                onDeclaredChange={(declared) => { setObstacleInventoryDeclared(declared); invalidate(); }}
                onSelectionChange={(ids) => { setAvailableObstacleExerciseIds(ids); invalidate(); }}
                options={obstacleOptions}
                selectedIds={availableObstacleExerciseIds}
              />
            </div>
          </Disclosure>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-64 flex-1 gap-2 text-sm font-bold">Trainingstitel<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Optional" value={title} /></label>
            <button className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] disabled:opacity-50" disabled={!canGenerate || busy} onClick={() => void generate()} type="button">{pending ? "Plane …" : builderMode === "ai" ? "AI-Vorschlag erzeugen" : "Lokal planen"}</button>
            <button className="min-h-11 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-foreground)] disabled:opacity-50" disabled={!draft || busy} onClick={() => void save()} type="button">Training speichern</button>
          </div>
          {error ? <div className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger)]">{error}</div> : null}
          {savedId ? <div className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm font-bold"><Link className="underline underline-offset-4" href={`/training/${savedId}`}>Gespeichertes Training öffnen</Link></div> : null}
          {draft ? (
            <>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
                <span className="text-xs font-semibold text-[var(--muted)]">
                  Entwurfshistorie · bis zu 20 Neuplanungen und Ersetzungen
                </span>
                <div className="flex gap-2">
                  <button
                    className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={undoDrafts.length === 0 || busy}
                    onClick={undoDraft}
                    type="button"
                  >
                    Rückgängig
                  </button>
                  <button
                    className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={redoDrafts.length === 0 || busy}
                    onClick={redoDraft}
                    type="button"
                  >
                    Wiederholen
                  </button>
                </div>
              </div>
              <TrainingDraftPreview
              draft={draft}
              onRegeneratePhase={(phase) => void regeneratePhase(phase)}
              onReplaceExercise={(exerciseId, mode) => void replaceExercise(exerciseId, mode)}
              regeneratingPhase={regeneratingPhase}
              replacingExerciseId={replacingExerciseId}
            />
            </>
          ) : null}
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] xl:sticky xl:top-4">
        <h2 className="font-black">Sportlogik</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--muted)]">
          <li>Warm-up, ein bis vier Hauptteile und Cooldown mit exakter Zeit- und Übungsanzahl.</li>
          <li>Jeder Hauptteil kann unabhängig als Intervall, Rundenblock, Ladder/Pyramide, Chipper oder Every-X programmiert werden.</li>
          <li>Bei mehreren Hauptteilen werden Übungen blockübergreifend variiert und nicht unnötig wiederholt.</li>
          <li>Teamgröße oder explizite Rotationsgruppen fließen in Stationskapazität und gleichzeitigen Equipmentbedarf ein.</li>
          <li>Technik und Koordination vor unnötiger Ermüdung; Conditioning danach, wenn gewählt.</li>
          <li>Abdeckung gewünschter Muskeln plus typische Gegenmuskeln und Gegenbewegungen.</li>
          <li>Push/Pull, Squat/Hinge und Rumpfrotation/Stabilisation werden für eine ausgewogene Einheit bevorzugt ergänzt.</li>
          <li>Hohe Stoßbelastungen und hohe Risiken werden nicht unnötig direkt hintereinander geplant.</li>
          <li>Drei direkt aufeinanderfolgende Übungen mit derselben lokalen Muskel-/Körperregion werden im Qualitätscheck beanstandet.</li>
          <li>Übungen aus den letzten Trainings erhalten einen weichen Wiederholungs-Malus; Trainer-Wunschübungen können ihn bewusst überstimmen.</li>
          <li>Alter, Ort, Ausschlussbereiche, Risiko, Equipment, Hindernisbestand und Stationskapazität bleiben harte Grenzen.</li>
          <li>Outdoor-Varianten verwenden bei Outdoor-Planung ihr eigenes geprüftes Ersatz-Equipment statt Studio-Geräten.</li>
          <li>Level-Varianten stammen aus dem freigegebenen Übungskatalog statt aus erfundenen Übungen.</li>
          <li>Phasen und einzelne Übungen können separat neu geplant bzw. leichter/schwerer/materialärmer ersetzt werden.</li>
          <li>AI kann bis zu sechs ausgewählte frühere Trainings als Rekompositions-Kontext erhalten, aber nur aktuell freigegebene Übungen auswählen.</li>
          <li>AI darf auswählen und begründen, aber niemals die deterministische Sicherheitsprüfung umgehen.</li>
        </ul>
      </aside>
    </div>
  );
}

function Field({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold">{label}{children}</label>;
}

function NumberField({ label, value, min, max, onChange }: { readonly label: string; readonly value: number; readonly min: number; readonly max: number; readonly onChange: (value: number) => void }) {
  return <Field label={label}><input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" max={max} min={min} onChange={(event) => onChange(clampInteger(Number(event.target.value), min, max))} type="number" value={value} /></Field>;
}

function Toggle({ active, onClick, children }: { readonly active: boolean; readonly onClick: () => void; readonly children: React.ReactNode }) {
  return <button aria-pressed={active} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold ${active ? "border-[var(--control-strong)] bg-[var(--control-strong)] text-[var(--control-strong-foreground)]" : "border-[var(--border)] bg-[var(--surface-subtle)]"}`} onClick={onClick} type="button">{children}</button>;
}
