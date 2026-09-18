import type { ObstacleGuidanceEditorData } from "@/server/obstacles/obstacle-editor-repository";

interface ExerciseObstacleGuidanceEditorProps {
  readonly data: ObstacleGuidanceEditorData;
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly disabled?: boolean;
}

export function ExerciseObstacleGuidanceEditor({
  data,
  action,
  disabled = false,
}: ExerciseObstacleGuidanceEditorProps) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          disabled={disabled}
          label="Stationskapazität"
          max={100}
          min={1}
          name="stationCapacity"
          step="1"
          value={data.stationCapacity}
        />
        <NumberField
          disabled={disabled}
          label="Freie Sicherheitszone (m)"
          max={50}
          min={0.1}
          name="clearZoneMetres"
          step="0.1"
          value={data.clearZoneMetres}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LocalizedObstacleFields
          disabled={disabled}
          locale="de"
          title="Deutsch"
          value={data.de}
        />
        <LocalizedObstacleFields
          disabled={disabled}
          locale="en"
          title="English"
          value={data.en}
        />
      </div>

      <div className="flex justify-end border-t border-[var(--border)] pt-4">
        <button
          className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
          type="submit"
        >
          Hindernis-Guidance speichern
        </button>
      </div>
    </form>
  );
}

function LocalizedObstacleFields({
  locale,
  title,
  value,
  disabled,
}: {
  readonly locale: "de" | "en";
  readonly title: string;
  readonly value: ObstacleGuidanceEditorData["de"];
  readonly disabled: boolean;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
      <div className="text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">{title}</div>
      <div className="mt-3 grid gap-3">
        <TextArea
          disabled={disabled}
          label="Geräte-/Hindernisaufbau"
          name={`${locale}EquipmentConfiguration`}
          value={value.equipmentConfiguration}
        />
        <TextArea
          disabled={disabled}
          label="Voraussetzungen"
          name={`${locale}Prerequisites`}
          value={value.prerequisites}
        />
        <TextArea
          disabled={disabled}
          label="Annäherung"
          name={`${locale}Approach`}
          value={value.approach}
        />
        <TextArea
          disabled={disabled}
          label="Ausführung"
          name={`${locale}Execution`}
          value={value.execution}
        />
        <TextArea
          disabled={disabled}
          label="Ausstieg / Reset"
          name={`${locale}ExitReset`}
          value={value.exitReset}
        />
        <TextArea
          disabled={disabled}
          label="Fallback / Regression"
          name={`${locale}FallbackExercise`}
          value={value.fallbackExercise}
        />
      </div>
    </section>
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
  readonly value: string;
  readonly disabled: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold">
      {label}
      <textarea
        className="min-h-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-normal leading-6"
        defaultValue={value}
        disabled={disabled}
        maxLength={4000}
        name={name}
        required
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
  step,
  disabled,
}: {
  readonly label: string;
  readonly name: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: string;
  readonly disabled: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold">
      {label}
      <input
        className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
        defaultValue={value}
        disabled={disabled}
        max={max}
        min={min}
        name={name}
        required
        step={step}
        type="number"
      />
    </label>
  );
}
