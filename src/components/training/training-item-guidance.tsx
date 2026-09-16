import type { TrainingExerciseGuidance } from "@/server/training/training-exercise-guidance-repository";

interface TrainingItemGuidanceProps {
  readonly guidance?: TrainingExerciseGuidance;
  readonly trainerInstructions?: string | null;
}

export function TrainingItemGuidance({ guidance, trainerInstructions }: TrainingItemGuidanceProps) {
  const hasDetails = Boolean(
    guidance?.purpose
      || guidance?.setup
      || guidance?.startPosition
      || guidance?.finishReset
      || guidance?.safetyNotes
      || guidance?.qualityCriteria
      || guidance?.executionSteps.length
      || guidance?.coachingCues.length
      || guidance?.commonMistakes.length,
  );

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
            </div>
          </div>
        </details>
      ) : null}
    </div>
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
