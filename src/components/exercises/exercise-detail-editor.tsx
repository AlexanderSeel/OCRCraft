import type { TrainingExerciseGuidance } from "@/server/training/training-exercise-guidance-repository";

interface ExerciseDetailEditorProps {
  readonly locale: "de" | "en";
  readonly guidance?: TrainingExerciseGuidance;
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly disabled?: boolean;
}

export function ExerciseDetailEditor({
  locale,
  guidance,
  action,
  disabled = false,
}: ExerciseDetailEditorProps) {
  const languageLabel = locale === "de" ? "Deutsch" : "English";

  return (
    <form action={action} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
      <input name="locale" type="hidden" value={locale} />
      <div className="mb-4">
        <div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">{languageLabel}</div>
        <h3 className="mt-1 text-lg font-black">Planung, Sicherheit & Skalierung</h3>
      </div>

      <details className="rounded-xl border border-[var(--border)] bg-[var(--surface)]" open>
        <summary className="cursor-pointer px-4 py-3 font-black">Zweck & Bewegungsrahmen</summary>
        <div className="grid gap-3 border-t border-[var(--border)] p-4">
          <TextArea disabled={disabled} label="Trainingszweck" name="purpose" value={guidance?.purpose} />
          <TextArea disabled={disabled} label="Aufbau / Setup" name="setup" value={guidance?.setup} />
          <div className="grid gap-3 lg:grid-cols-2">
            <TextArea disabled={disabled} label="Startposition" name="startPosition" value={guidance?.startPosition} />
            <TextArea disabled={disabled} label="Abschluss / Reset" name="finishReset" value={guidance?.finishReset} />
          </div>
        </div>
      </details>

      <details className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <summary className="cursor-pointer px-4 py-3 font-black">Qualität & Sicherheit</summary>
        <div className="grid gap-3 border-t border-[var(--border)] p-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <TextArea disabled={disabled} label="Atmungs-Cue" name="breathingCue" value={guidance?.breathingCue} />
            <TextArea disabled={disabled} label="Tempo-Cue" name="tempoCue" value={guidance?.tempoCue} />
          </div>
          <TextArea disabled={disabled} label="Qualitätskriterien" name="qualityCriteria" value={guidance?.qualityCriteria} />
          <TextArea disabled={disabled} label="Sicherheitshinweise" name="safetyNotes" value={guidance?.safetyNotes} />
          <div className="grid gap-3 lg:grid-cols-2">
            <TextArea disabled={disabled} label="Voraussetzungen" name="prerequisites" value={guidance?.prerequisites} />
            <TextArea disabled={disabled} label="Fallback / Regression" name="fallbackExercise" value={guidance?.fallbackExercise} />
          </div>
        </div>
      </details>

      <details className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <summary className="cursor-pointer px-4 py-3 font-black">Dosierung & Programmierung</summary>
        <div className="grid gap-3 border-t border-[var(--border)] p-4">
          <TextArea disabled={disabled} label="Einsteiger-Dosierung" name="beginnerPrescription" value={guidance?.beginnerPrescription} />
          <TextArea disabled={disabled} label="Standard-Dosierung" name="standardPrescription" value={guidance?.standardPrescription} />
          <TextArea disabled={disabled} label="Fortgeschrittenen-Dosierung" name="advancedPrescription" value={guidance?.advancedPrescription} />
          <TextArea disabled={disabled} label="Belastung / Pause" name="workRestGuidance" value={guidance?.workRestGuidance} />
          <div className="grid gap-3 lg:grid-cols-2">
            <TextArea disabled={disabled} label="Pace / Tempoleitlinie" name="paceGuidance" value={guidance?.paceGuidance} />
            <TextArea disabled={disabled} label="Herzfrequenz-Zone (Orientierung)" name="heartRateZone" value={guidance?.heartRateZone} />
          </div>
        </div>
      </details>

      <details className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <summary className="cursor-pointer px-4 py-3 font-black">Level & Zielgruppen-Varianten</summary>
        <div className="grid gap-3 border-t border-[var(--border)] p-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <TextArea disabled={disabled} label="Level 1" name="level1" value={guidance?.level1} />
            <TextArea disabled={disabled} label="Level 2" name="level2" value={guidance?.level2} />
            <TextArea disabled={disabled} label="Level 3" name="level3" value={guidance?.level3} />
          </div>
          <TextArea disabled={disabled} label="Kinder-/Jugendvariante" name="childYouthVariant" value={guidance?.childYouthVariant} />
        </div>
      </details>

      <div className="mt-4 flex justify-end border-t border-[var(--border)] pt-4">
        <button
          className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
          type="submit"
        >
          {languageLabel} Details speichern
        </button>
      </div>
    </form>
  );
}

interface ExerciseLogisticsEditorProps {
  readonly guidance?: TrainingExerciseGuidance;
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly disabled?: boolean;
}

export function ExerciseLogisticsEditor({
  guidance,
  action,
  disabled = false,
}: ExerciseLogisticsEditorProps) {
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="grid gap-2 text-sm font-bold">
        Schwierigkeit
        <select
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={guidance?.difficulty ?? "beginner"}
          disabled={disabled}
          name="difficulty"
        >
          <option value="beginner">Einsteiger</option>
          <option value="intermediate">Mittel</option>
          <option value="advanced">Fortgeschritten</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Aufsicht
        <select
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={guidance?.supervision ?? "normal"}
          disabled={disabled}
          name="supervision"
        >
          <option value="normal">Normal</option>
          <option value="increased">Erhöht</option>
          <option value="direct">Direkt</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Platzbedarf
        <input
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={guidance?.spaceRequirement ?? "medium"}
          disabled={disabled}
          maxLength={120}
          name="spaceRequirement"
          required
        />
      </label>
      <NumberField disabled={disabled} label="Aufbauzeit (Sek.)" max={3600} min={0} name="setupSeconds" value={guidance?.setupSeconds ?? 60} />
      <NumberField disabled={disabled} label="Wechselzeit (Sek.)" max={1800} min={0} name="transitionSeconds" value={guidance?.transitionSeconds ?? 20} />
      <NumberField disabled={disabled} label="Stationskapazität" max={100} min={1} name="stationCapacity" value={guidance?.stationCapacity ?? 1} />
      <NumberField disabled={disabled} label="Max. gleichzeitig" max={1000} min={1} name="maxSimultaneousParticipants" value={guidance?.maxSimultaneousParticipants ?? guidance?.stationCapacity ?? 1} />
      <TextField disabled={disabled} label="Untergrund" name="surfaceRequirements" value={guidance?.surfaceRequirements} />
      <TextField disabled={disabled} label="Wetter / Gelände" name="weatherTerrain" value={guidance?.weatherTerrain} />
      <TextField disabled={disabled} label="Hindernis-Konfiguration" name="obstacleConfiguration" value={guidance?.obstacleConfiguration} />
      <NumberField optional disabled={disabled} label="Vereinsmaß Höhe (cm)" max={1000} min={0.1} name="clubObstacleHeightCm" value={guidance?.clubObstacleHeightCm ?? undefined} />
      <NumberField optional disabled={disabled} label="Vereinsmaß Spannweite (cm)" max={1000} min={0.1} name="clubObstacleSpanCm" value={guidance?.clubObstacleSpanCm ?? undefined} />
      <NumberField optional disabled={disabled} label="Vereinsmaß Reichweite (cm)" max={1000} min={0.1} name="clubObstacleReachCm" value={guidance?.clubObstacleReachCm ?? undefined} />
      <div className="flex items-end justify-end md:col-span-2 xl:col-span-3">
        <button
          className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
          type="submit"
        >
          Logistik speichern
        </button>
      </div>
    </form>
  );
}

function TextArea({
  label,
  name,
  value,
  disabled,
}: {
  readonly label: string;
  readonly name: string;
  readonly value?: string | null;
  readonly disabled: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <textarea
        className="min-h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-normal leading-6 outline-none focus:border-[var(--focus)] disabled:opacity-60"
        defaultValue={value ?? ""}
        disabled={disabled}
        maxLength={4000}
        name={name}
      />
    </label>
  );
}

function NumberField({
  label,
  name,
  value,
  min,
  max,
  disabled,
  optional = false,
}: {
  readonly label: string;
  readonly name: string;
  readonly value?: number;
  readonly min: number;
  readonly max: number;
  readonly disabled: boolean;
  readonly optional?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
        defaultValue={value ?? ""}
        disabled={disabled}
        max={max}
        min={min}
        name={name}
        required={!optional}
        type="number"
      />
    </label>
  );
}

function TextField({ label, name, value, disabled }: { readonly label: string; readonly name: string; readonly value?: string | null; readonly disabled: boolean }) {
  return <label className="grid gap-2 text-sm font-bold">{label}<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={value ?? ""} disabled={disabled} maxLength={1000} name={name} required={name !== "obstacleConfiguration"} /></label>;
}
