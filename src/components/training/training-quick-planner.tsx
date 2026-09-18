"use client";

import { useMemo, useState } from "react";
import type { TrainingDraft } from "@/domain/training/draft";
import { BODY_REGION_OPTIONS, COARSE_BODY_REGION_IDS } from "@/domain/body-regions";
import type { EquipmentAvailabilityOption } from "./equipment-availability-picker";
import type { TrainingObstacleOption } from "@/server/training/training-draft-catalog-core";
import { ObstacleAvailabilityPicker } from "./obstacle-availability-picker";
import { TrainingDraftPreview } from "./training-draft-preview";

const goals = ["Ganzkörper", "OCR-Technik", "Grip", "Kraftausdauer", "Laufen", "Core", "Balance", "Koordination"] as const;
const formats = [
  ["circuit", "Zirkel"],
  ["rig-run", "Rig & Run"],
  ["technique", "Technik"],
  ["relay", "Team / Staffel"],
  ["partner", "Partner Workout"],
  ["run-exercise", "Run + Exercise"],
  ["amrap", "AMRAP"],
] as const;
const locations = [["mixed", "Flexibel"], ["indoor", "Indoor"], ["outdoor", "Outdoor"]] as const;
const audiences = [["adults", "Erwachsene"], ["youth", "Jugend"], ["kids", "Kids"], ["mixed", "Mixed"]] as const;

interface TrainingQuickPlannerProps {
  readonly equipmentOptions?: readonly EquipmentAvailabilityOption[];
  readonly obstacleOptions?: readonly TrainingObstacleOption[];
}

export function TrainingQuickPlanner({
  equipmentOptions = [],
  obstacleOptions = [],
}: TrainingQuickPlannerProps) {
  const [audience, setAudience] = useState("adults");
  const [participants, setParticipants] = useState(12);
  const [duration, setDuration] = useState(60);
  const [goal, setGoal] = useState("Ganzkörper");
  const [bodyRegion, setBodyRegion] = useState("full-body");
  const [format, setFormat] = useState("circuit");
  const [location, setLocation] = useState("mixed");
  const [warmupCount, setWarmupCount] = useState(2);
  const [mainPartCounts, setMainPartCounts] = useState<readonly number[]>([4]);
  const [cooldownCount, setCooldownCount] = useState(2);
  const [mainPartCount, setMainPartCountState] = useState(1);
  const [organizationMode, setOrganizationMode] = useState<"solo" | "team">("solo");
  const [teamSize, setTeamSize] = useState(4);
  const [groupSplitCount, setGroupSplitCount] = useState<number | undefined>();
  const [obstacleInventoryDeclared, setObstacleInventoryDeclared] = useState(false);
  const [availableObstacleExerciseIds, setAvailableObstacleExerciseIds] = useState<readonly string[]>(() =>
    obstacleOptions.map((option) => option.id),
  );
  const [draft, setDraft] = useState<TrainingDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const coarseOptions = useMemo(() => BODY_REGION_OPTIONS.filter((option) =>
    (COARSE_BODY_REGION_IDS as readonly string[]).includes(option.id)
  ), []);
  const automaticEquipment = useMemo(() => equipmentOptions.flatMap((option) =>
    option.quantityAvailable == null
      ? []
      : [{ equipmentId: option.id, quantityAvailable: option.quantityAvailable }]
  ), [equipmentOptions]);

  function setMainPartCount(value: number) {
    const nextCount = Math.max(1, Math.min(4, value));
    setMainPartCountState(nextCount);
    setMainPartCounts((current) => Array.from({ length: nextCount }, (_, index) => current[index] ?? current.at(-1) ?? 4));
    invalidateDraft();
  }

  function setMainPartExerciseCount(index: number, value: number) {
    setMainPartCounts((current) => current.map((count, candidateIndex) => candidateIndex === index ? value : count));
    invalidateDraft();
  }

  function invalidateDraft() {
    setDraft(null);
    setSavedId(null);
    setError(null);
  }

  function requestBody() {
    return {
      audience,
      participantCount: participants,
      durationMinutes: duration,
      goals: [goal],
      bodyRegions: bodyRegion === "full-body" ? [] : [bodyRegion],
      avoidBodyRegions: [],
      exerciseTypes: [],
      formats: [format],
      location,
      intensity: format === "technique" ? "technique" : "balanced",
      builderMode: "local",
      warmupExerciseCount: warmupCount,
      mainExerciseCount: mainPartCounts[0] ?? 4,
      mainPartExerciseCounts: mainPartCounts,
      cooldownExerciseCount: cooldownCount,
      mainPartCount,
      organizationMode: format === "partner" ? "team" : organizationMode,
      teamSize: format === "partner" ? 2 : organizationMode === "team" ? Math.min(teamSize, participants) : undefined,
      groupSplitCount: format !== "partner" && organizationMode === "solo" && groupSplitCount != null
        ? Math.min(groupSplitCount, participants, 20)
        : undefined,
      sourceTrainingIds: [],
      preferredExerciseIds: [],
      availableEquipment: automaticEquipment,
      availableObstacleExerciseIds: obstacleInventoryDeclared ? availableObstacleExerciseIds : undefined,
      locale: "de",
    };
  }

  async function generate() {
    setBusy(true);
    setError(null);
    setSavedId(null);
    try {
      const response = await fetch("/api/training/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody()),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(payload?.message ?? `Quickplan konnte nicht erzeugt werden (${response.status}).`);
      }
      setDraft(await response.json() as TrainingDraft);
    } catch (cause) {
      setDraft(null);
      setError(cause instanceof Error ? cause.message : "Quickplan konnte nicht erzeugt werden.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/training/draft/persist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ request: requestBody(), title: `Quickplan · ${goal}` }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(payload?.message ?? `Quickplan konnte nicht gespeichert werden (${response.status}).`);
      }
      const payload = await response.json() as { id: string; draft: TrainingDraft };
      setSavedId(payload.id);
      setDraft(payload.draft);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Quickplan konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">Quickplaner · lokal</div>
          <h2 className="mt-1 text-xl font-black">Mit wenigen Angaben direkt zum Training</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Kein AI-Aufruf. OCRCraft nutzt den freigegebenen Übungspool und die Sportlogik für Belastung, Bewegungsmuster, Muskelbalance, Alter, Equipment, Hindernisbestand, Rotationsgruppen und Wiederholungen.</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-black">Deterministisch</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select label="Zielgruppe" value={audience} onChange={(value) => { setAudience(value); invalidateDraft(); }} options={audiences} />
        <NumberField label="Teilnehmer" value={participants} min={1} max={200} onChange={(value) => { setParticipants(value); invalidateDraft(); }} />
        <NumberField label="Dauer (Min.)" value={duration} min={30} max={180} onChange={(value) => { setDuration(value); invalidateDraft(); }} />
        <Select label="Ziel" value={goal} onChange={(value) => { setGoal(value); invalidateDraft(); }} options={goals.map((value) => [value, value] as const)} />
        <Select label="Muskel-/Körperfokus" value={bodyRegion} onChange={(value) => { setBodyRegion(value); invalidateDraft(); }} options={coarseOptions.map((option) => [option.id, option.labelDe] as const)} />
        <Select label="Format" value={format} onChange={(value) => {
          setFormat(value);
          if (value === "partner") {
            setOrganizationMode("team");
            setTeamSize(2);
            setGroupSplitCount(undefined);
          }
          invalidateDraft();
        }} options={formats} />
        <Select label="Ort" value={location} onChange={(value) => { setLocation(value); invalidateDraft(); }} options={locations} />
        <Select label="Organisation" value={organizationMode} onChange={(value) => { setOrganizationMode(value as "solo" | "team"); invalidateDraft(); }} options={[["solo", "Alleine / individuell"], ["team", "Teams"]]} />
      </div>

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Warm-up Übungen" value={warmupCount} min={1} max={6} onChange={(value) => { setWarmupCount(value); invalidateDraft(); }} />
          <NumberField label="Hauptteile" value={mainPartCount} min={1} max={4} onChange={setMainPartCount} />
          <NumberField label="Cooldown Übungen" value={cooldownCount} min={1} max={6} onChange={(value) => { setCooldownCount(value); invalidateDraft(); }} />
          {organizationMode === "team" ? (
            <NumberField label="Teamgröße" value={teamSize} min={2} max={Math.max(2, participants)} onChange={(value) => { setTeamSize(value); invalidateDraft(); }} />
          ) : (
            <OptionalNumberField
              label="Rotationsgruppen"
              max={Math.min(20, Math.max(1, participants))}
              min={1}
              onChange={(value) => { setGroupSplitCount(value); invalidateDraft(); }}
              placeholder="Automatisch"
              value={groupSplitCount}
            />
          )}
        </div>
        <div className={`mt-3 grid gap-3 ${mainPartCount === 1 ? "sm:max-w-xs" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          {mainPartCounts.map((count, index) => (
            <NumberField
              key={index}
              label={mainPartCount === 1 ? "Übungen Hauptteil" : `Übungen Hauptteil ${index + 1}`}
              value={count}
              min={1}
              max={8}
              onChange={(value) => setMainPartExerciseCount(index, value)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
          {organizationMode === "solo" && groupSplitCount != null
            ? `${participants} Teilnehmende werden für Kapazitäts- und Materialprüfung als ${groupSplitCount} Rotationsgruppen mit bis zu ${Math.ceil(participants / groupSplitCount)} Personen je Gruppe gerechnet. `
            : "Ohne feste Rotationsgruppen verteilt OCRCraft die Teilnehmenden automatisch über die aktiven Stationen. "}
          {automaticEquipment.length > 0
            ? `Der Quickplaner verwendet außerdem ${automaticEquipment.length} bekannte Equipment-Bestände. Für Outdoor werden vorhandene Outdoor-Ersatzvarianten berücksichtigt.`
            : "Es ist kein Equipment-Bestand hinterlegt; mögliche Materialkonflikte werden als unbekannt ausgewiesen."}
        </p>

        <details className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4" open={obstacleInventoryDeclared}>
          <summary className="cursor-pointer text-sm font-black">OCR-Hindernisbestand</summary>
          <div className="mt-3">
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
        </details>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] disabled:opacity-50" disabled={busy} onClick={generate} type="button">
          {busy ? "Plane…" : "Quickplan erstellen"}
        </button>
        {draft ? <button className="min-h-11 rounded-xl border border-[var(--border)] px-5 text-sm font-black disabled:opacity-50" disabled={saving} onClick={save} type="button">{saving ? "Speichere…" : "Training speichern"}</button> : null}
      </div>

      {error ? <p className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">{error}</p> : null}
      {savedId ? <p className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">Training gespeichert: {savedId}</p> : null}
      {draft ? <div className="mt-6 border-t border-[var(--border)] pt-6"><TrainingDraftPreview draft={draft} /></div> : null}
    </section>
  );
}

function Select({ label, value, onChange, options }: { readonly label: string; readonly value: string; readonly onChange: (value: string) => void; readonly options: readonly (readonly [string, string])[] }) {
  return <label className="grid gap-1.5 text-sm font-black">{label}<select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" onChange={(event) => onChange(event.target.value)} value={value}>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}

function NumberField({ label, value, min, max, onChange }: { readonly label: string; readonly value: number; readonly min: number; readonly max: number; readonly onChange: (value: number) => void }) {
  return <label className="grid gap-1.5 text-sm font-black">{label}<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" max={max} min={min} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value) || min)))} type="number" value={value} /></label>;
}

function OptionalNumberField({ label, value, min, max, placeholder, onChange }: { readonly label: string; readonly value?: number; readonly min: number; readonly max: number; readonly placeholder?: string; readonly onChange: (value: number | undefined) => void }) {
  return <label className="grid gap-1.5 text-sm font-black">{label}<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" max={max} min={min} onChange={(event) => onChange(event.target.value === "" ? undefined : Math.max(min, Math.min(max, Number(event.target.value) || min)))} placeholder={placeholder} type="number" value={value ?? ""} /></label>;
}