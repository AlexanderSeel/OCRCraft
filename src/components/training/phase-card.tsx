import {
  TRAINING_PHASE_LABELS,
  type TrainingPhase,
} from "@/domain/training/model";
import { Card } from "@/components/ui/card";

interface TrainingPhaseCardProps {
  readonly phase: TrainingPhase;
}

const phaseAccent = {
  warmup: { marker: "bg-[var(--phase-warmup)]", surface: "bg-[var(--phase-warmup-soft)]" },
  main: { marker: "bg-[var(--phase-main)]", surface: "bg-[var(--phase-main-soft)]" },
  cooldown: { marker: "bg-[var(--phase-cooldown)]", surface: "bg-[var(--phase-cooldown-soft)]" },
} as const;

export function TrainingPhaseCard({ phase }: TrainingPhaseCardProps) {
  const duration = phase.items.reduce((total, item) => total + item.durationMinutes, 0);
  const tone = phaseAccent[phase.kind];

  return (
    <Card className="overflow-hidden">
      <div className={`flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 ${tone.surface}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className={`h-7 w-1 rounded-sm ${tone.marker}`} />
          <div className="min-w-0">
            <div className="ui-kicker">{TRAINING_PHASE_LABELS[phase.kind]}</div>
            <h3 className="truncate text-sm font-black">{phase.title}</h3>
          </div>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-black">{duration} Min.</div>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {phase.items.map((item, index) => (
          <article className="grid gap-2.5 px-4 py-3 sm:grid-cols-[30px_minmax(0,1fr)_auto] sm:items-center" key={item.id}>
            <div className="grid size-7 place-items-center rounded-md bg-[var(--surface-subtle)] text-[11px] font-black text-[var(--muted)]">{index + 1}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="text-sm font-bold">{item.exercise.name}</h4>
                {item.levelLabel ? <span className="rounded-sm bg-[var(--surface-subtle)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--muted)]">{item.levelLabel}</span> : null}
              </div>
              {item.instructions ? <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">{item.instructions}</p> : null}
            </div>
            <div className="text-xs font-black sm:text-right">{item.durationMinutes} Min.</div>
          </article>
        ))}
      </div>
    </Card>
  );
}
