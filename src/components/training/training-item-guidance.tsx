import { setTrainingItemLevelAction } from "@/app/training/[id]/level-action";
import type { TrainingExerciseGuidance } from "@/server/training/training-exercise-guidance-repository";

interface TrainingItemGuidanceProps {
  readonly guidance?: TrainingExerciseGuidance;
  readonly trainerInstructions?: string | null;
  readonly sessionId?: string;
  readonly itemId?: string;
  readonly selectedLevel?: string | null;
  readonly editable?: boolean;
}

export function TrainingItemGuidance({
  guidance,
  trainerInstructions,
  sessionId,
  itemId,
  selectedLevel,
  editable = false,
}: TrainingItemGuidanceProps) {
  const hasLevels = Boolean(guidance?.level1 || guidance?.level2 || guidance?.level3);
  const hasDetails = Boolean(
    guidance?.purpose
      || guidance?.setup
      || guidance?.startPosition
      || guidance?.finishReset
      || guidance?.breathingCue
      || guidance?.tempoCue
      || guidance?.safetyNotes
      || guidance?.qualityCriteria
      || guidance?.beginnerPrescription
      || guidance?.standardPrescription
      || guidance?.advancedPrescription
      || guidance?.workRestGuidance
      || guidance?.childYouthVariant
      || guidance?.prerequisites
      || guidance?.fallbackExercise
      || guidance?.executionSteps.length
      || guidance?.coachingCues.length
      || guidance?.commonMistakes.length
      || hasLevels,
  );
  const canEditLevel = editable && sessionId && itemId && hasLevels;
  const levelAction = canEditLevel ? setTrainingItemLevelAction.bind(null, sessionId, itemId) : null;

  return (
    <div className="mt-2 space-y-2">
      {guidance?.summary ? (
        <p className="text-sm leading-6 text-[var(--foreground)]">{guidance.summary}</p>
      ) : null}

      {trainerInstructions ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--muted)]">
          <span className="font-black text-[var(--foreground)]">Trainerhinweis: </span>
          <span className="whitespace-pre-line">{trainerInstructions}</span>
        </div>
      ) : null}

      {hasLevels ? (
        <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <summary className="cursor-pointer px-3 py-2 text-xs font-black text-[var(--foreground)]">
            Level 1–3 & Skalierung
          </summary>
          {levelAction ? (
            <form action={levelAction} className="flex flex-wrap items-end gap-2 border-t border-[var(--border)] bg-[var(--surface-subtle)] p-3">
              <label className="grid min-w-48 flex-1 gap-1 text-xs font-black">
                Variante für dieses Training
                <select
                  className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
                  defaultValue={structuredLevelValue(selectedLevel)}
                  name="level"
                >
                  <option value="">Keine feste Level-Zuordnung</option>
                  <option value="Level 1">Level 1 · Regression</option>
                  <option value="Level 2">Level 2 · Standard</option>
                  <option value="Level 3">Level 3 · Progression</option>
                </select>
              </label>
              <button
                className="h-10 rounded-lg bg-[var(--control-strong)] px-4 text-xs font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)]"
                type="submit"
              >
                Level übernehmen
              </button>
              {selectedLevel && !isStructuredLevel(selectedLevel) ? (
                <div className="w-full text-xs text-[var(--muted)]">
                  Bisherige freie Variante „{selectedLevel}“ wird erst beim Speichern einer Level-Auswahl ersetzt.
                </div>
              ) : null}
            </form>
          ) : null}
          <div className={`${levelAction ? "" : "border-t border-[var(--border)]"} grid gap-3 p-3 md:grid-cols-3`}>
            <LevelGuide level="Level 1" selected={selectedLevel === "Level 1"} value={guidance?.level1} />
            <LevelGuide level="Level 2" selected={selectedLevel === "Level 2"} value={guidance?.level2} />
            <LevelGuide level="Level 3" selected={selectedLevel === "Level 3"} value={guidance?.level3} />
          </div>
          {guidance?.childYouthVariant || guidance?.prerequisites || guidance?.fallbackExercise ? (
            <div className="grid gap-3 border-t border-[var(--border)] p-3 text-sm leading-6 md:grid-cols-3">
              {guidance.childYouthVariant ? <GuidanceSection title="Kinder / Jugend">{guidance.childYouthVariant}</GuidanceSection> : null}
              {guidance.prerequisites ? <GuidanceSection title="Voraussetzungen">{guidance.prerequisites}</GuidanceSection> : null}
              {guidance.fallbackExercise ? <GuidanceSection title="Fallback">{guidance.fallbackExercise}</GuidanceSection> : null}
            </div>
          ) : null}
        </details>
      ) : null}

      {hasDetails ? (
        <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <summary className="cursor-pointer px-3 py-2 text-xs font-black text-[var(--foreground)]">
            Ausführung, Coaching & Sicherheit
          </summary>
          <div className="grid gap-4 border-t border-[var(--border)] p-3 text-sm leading-6 lg:grid-cols-2">
            <div className="space-y-4">
              {guidance?.purpose ? <GuidanceSection title="Zweck">{guidance.purpose}</GuidanceSection> : null}
              {guidance?.setup ? <GuidanceSection title="Aufbau">{guidance.setup}</GuidanceSection> : null}
              {guidance?.startPosition ? <GuidanceSection title="Startposition">{guidance.startPosition}</GuidanceSection> : null}
              {guidance?.executionSteps.length ? (
                <GuidanceSection title="Ausführung">
                  <ol className="list-decimal space-y-1 pl-5">
                    {guidance.executionSteps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
                  </ol>
                </GuidanceSection>
              ) : null}
              {guidance?.finishReset ? <GuidanceSection title="Abschluss / Reset">{guidance.finishReset}</GuidanceSection> : null}
              {guidance?.breathingCue ? <GuidanceSection title="Atmung">{guidance.breathingCue}</GuidanceSection> : null}
              {guidance?.tempoCue ? <GuidanceSection title="Tempo / Rhythmus">{guidance.tempoCue}</GuidanceSection> : null}
            </div>

            <div className="space-y-4">
              {guidance?.coachingCues.length ? (
                <GuidanceSection title="Coaching-Cues">
                  <ul className="list-disc space-y-1 pl-5">
                    {guidance.coachingCues.map((cue, index) => <li key={`${index}-${cue}`}>{cue}</li>)}
                  </ul>
                </GuidanceSection>
              ) : null}
              {guidance?.commonMistakes.length ? (
                <GuidanceSection title="Häufige Fehler">
                  <div className="space-y-2">
                    {guidance.commonMistakes.map((entry, index) => (
                      <div className="rounded-lg bg-[var(--surface-subtle)] p-2" key={`${index}-${entry.mistake}`}>
                        <div><span className="font-black">Fehler:</span> {entry.mistake}</div>
                        <div><span className="font-black">Korrektur:</span> {entry.correction}</div>
                      </div>
                    ))}
                  </div>
                </GuidanceSection>
              ) : null}
              {guidance?.safetyNotes ? (
                <GuidanceSection title="Sicherheit">
                  <div className="rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] p-2 text-[var(--foreground)]">
                    {guidance.safetyNotes}
                  </div>
                </GuidanceSection>
              ) : null}
              {guidance?.qualityCriteria ? <GuidanceSection title="Qualitätskriterium">{guidance.qualityCriteria}</GuidanceSection> : null}
              {guidance?.beginnerPrescription || guidance?.standardPrescription || guidance?.advancedPrescription ? (
                <GuidanceSection title="Dosierung">
                  <dl className="space-y-1">
                    {guidance.beginnerPrescription ? <div><dt className="inline font-black">Einsteiger: </dt><dd className="inline">{guidance.beginnerPrescription}</dd></div> : null}
                    {guidance.standardPrescription ? <div><dt className="inline font-black">Standard: </dt><dd className="inline">{guidance.standardPrescription}</dd></div> : null}
                    {guidance.advancedPrescription ? <div><dt className="inline font-black">Fortgeschritten: </dt><dd className="inline">{guidance.advancedPrescription}</dd></div> : null}
                  </dl>
                </GuidanceSection>
              ) : null}
              {guidance?.workRestGuidance ? <GuidanceSection title="Belastung / Pause">{guidance.workRestGuidance}</GuidanceSection> : null}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}

function isStructuredLevel(value?: string | null): value is "Level 1" | "Level 2" | "Level 3" {
  return value === "Level 1" || value === "Level 2" || value === "Level 3";
}

function structuredLevelValue(value?: string | null): string {
  return isStructuredLevel(value) ? value : "";
}

function LevelGuide({
  level,
  value,
  selected,
}: {
  readonly level: string;
  readonly value?: string | null;
  readonly selected: boolean;
}) {
  return (
    <section className={`rounded-lg border p-3 ${selected ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]" : "border-transparent bg-[var(--surface-subtle)]"}`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">{level}</h4>
        {selected ? <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-black text-[var(--accent-foreground)]">Gewählt</span> : null}
      </div>
      <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">{value || "Keine eigene Variante hinterlegt."}</p>
    </section>
  );
}

function GuidanceSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-1 text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">{title}</h4>
      <div className="text-[var(--foreground)]">{children}</div>
    </section>
  );
}
