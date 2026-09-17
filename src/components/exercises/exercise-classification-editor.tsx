import {
  exerciseCoordinationComplexities,
  exerciseCoordinationComplexityLabels,
  exerciseDifficulties,
  exerciseDifficultyLabels,
  exerciseImpactLevels,
  exerciseImpactLevelLabels,
  exerciseLateralities,
  exerciseLateralityLabels,
  exerciseMovementPlanes,
  exerciseMovementPlaneLabels,
  exerciseTrainingGoalLabels,
  exerciseTrainingGoals,
  exerciseTypeLabels,
  exerciseTypes,
} from "@/domain/exercise/classification";
import type { ExerciseClassificationEditorData } from "@/server/exercises/exercise-classification-repository";

interface ExerciseClassificationEditorProps {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly data: ExerciseClassificationEditorData;
  readonly disabled?: boolean;
}

export function ExerciseClassificationEditor({ action, data, disabled = false }: ExerciseClassificationEditorProps) {
  const selectedGoals = new Set(data.trainingGoals);

  return (
    <form action={action} className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div>
          <h2 className="text-lg font-black">Trainingsziele & Bewegungsprofil</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[var(--muted)]">
            Diese Angaben steuern Suche, Quick Create und spätere AI-Komposition. Sie beschreiben die Übung unabhängig von einzelnen Trainingsplänen.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SelectField disabled={disabled} label="Übungstyp" name="exerciseType" value={data.exerciseType}>
            {exerciseTypes.map((value) => <option key={value} value={value}>{exerciseTypeLabels[value]}</option>)}
          </SelectField>
          <SelectField disabled={disabled} label="Schwierigkeit" name="difficulty" value={data.difficulty}>
            {exerciseDifficulties.map((value) => <option key={value} value={value}>{exerciseDifficultyLabels[value]}</option>)}
          </SelectField>
          <SelectField disabled={disabled} label="Impact" name="impactLevel" value={data.impactLevel}>
            {exerciseImpactLevels.map((value) => <option key={value} value={value}>{exerciseImpactLevelLabels[value]}</option>)}
          </SelectField>
          <SelectField disabled={disabled} label="Koordinative Komplexität" name="coordinationComplexity" value={data.coordinationComplexity}>
            {exerciseCoordinationComplexities.map((value) => <option key={value} value={value}>{exerciseCoordinationComplexityLabels[value]}</option>)}
          </SelectField>
          <SelectField disabled={disabled} label="Seitigkeit" name="laterality" value={data.laterality}>
            {exerciseLateralities.map((value) => <option key={value} value={value}>{exerciseLateralityLabels[value]}</option>)}
          </SelectField>
          <SelectField disabled={disabled} label="Bewegungsebene" name="movementPlane" value={data.movementPlane}>
            {exerciseMovementPlanes.map((value) => <option key={value} value={value}>{exerciseMovementPlaneLabels[value]}</option>)}
          </SelectField>
        </div>

        <div className="mt-5">
          <div className="text-sm font-black">Trainingsziele</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {exerciseTrainingGoals.map((goal) => (
              <CheckCard
                checked={selectedGoals.has(goal)}
                disabled={disabled}
                key={goal}
                label={exerciseTrainingGoalLabels[goal].de}
                name="trainingGoals"
                secondary={exerciseTrainingGoalLabels[goal].en}
                value={goal}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">Mindestens ein Trainingsziel ist erforderlich.</p>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <ToggleCard checked={data.progressionRequired} disabled={disabled} label="Progression erforderlich" name="progressionRequired" description="Level 1–3 bzw. Regression/Progression sollte gepflegt sein." />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-lg font-black">Zielgruppe & Umgebung</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <ToggleCard checked={data.suitableForKids} disabled={disabled} label="Kinder" name="suitableForKids" />
          <ToggleCard checked={data.suitableForYouth} disabled={disabled} label="Jugend" name="suitableForYouth" />
          <ToggleCard checked={data.suitableForAdults} disabled={disabled} label="Erwachsene" name="suitableForAdults" />
          <ToggleCard checked={data.indoorSuitable} disabled={disabled} label="Indoor" name="indoorSuitable" />
          <ToggleCard checked={data.outdoorSuitable} disabled={disabled} label="Outdoor" name="outdoorSuitable" />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-lg font-black">Unterstützte Dosierung</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Nur Einheiten aktivieren, die für diese Übung sinnvoll programmiert werden können.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <ToggleCard checked={data.supportsReps} disabled={disabled} label="Wiederholungen" name="supportsReps" />
          <ToggleCard checked={data.supportsSeconds} disabled={disabled} label="Sekunden" name="supportsSeconds" />
          <ToggleCard checked={data.supportsMinutes} disabled={disabled} label="Minuten" name="supportsMinutes" />
          <ToggleCard checked={data.supportsMetres} disabled={disabled} label="Meter" name="supportsMetres" />
          <ToggleCard checked={data.supportsRounds} disabled={disabled} label="Runden" name="supportsRounds" />
          <ToggleCard checked={data.supportsAttempts} disabled={disabled} label="Versuche" name="supportsAttempts" />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
          type="submit"
        >
          Klassifikation speichern
        </button>
      </div>
    </form>
  );
}

function SelectField({
  label,
  name,
  value,
  disabled,
  children,
}: {
  readonly label: string;
  readonly name: string;
  readonly value: string;
  readonly disabled: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <select
        className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
        defaultValue={value}
        disabled={disabled}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}

function CheckCard({
  name,
  value,
  label,
  secondary,
  checked,
  disabled,
}: {
  readonly name: string;
  readonly value: string;
  readonly label: string;
  readonly secondary?: string;
  readonly checked: boolean;
  readonly disabled: boolean;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
      <input defaultChecked={checked} disabled={disabled} name={name} type="checkbox" value={value} />
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        {secondary && secondary !== label ? <span className="block text-[11px] text-[var(--muted)]">{secondary}</span> : null}
      </span>
    </label>
  );
}

function ToggleCard({
  name,
  label,
  description,
  checked,
  disabled,
}: {
  readonly name: string;
  readonly label: string;
  readonly description?: string;
  readonly checked: boolean;
  readonly disabled: boolean;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
      <input className="mt-0.5" defaultChecked={checked} disabled={disabled} name={name} type="checkbox" />
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        {description ? <span className="mt-0.5 block text-[11px] leading-4 text-[var(--muted)]">{description}</span> : null}
      </span>
    </label>
  );
}
