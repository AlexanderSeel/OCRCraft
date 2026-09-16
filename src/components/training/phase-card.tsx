import {
  TRAINING_PHASE_LABELS,
  type TrainingPhase,
} from "@/domain/training/model";

interface TrainingPhaseCardProps {
  readonly phase: TrainingPhase;
}

const phaseAccent = {
  warmup: "bg-sky-400",
  main: "bg-[var(--accent-strong)]",
  cooldown: "bg-violet-400",
} as const;

export function TrainingPhaseCard({ phase }: TrainingPhaseCardProps) {
  const duration = phase.items.reduce((total, item) => total + item.durationMinutes, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className={`h-9 w-1.5 rounded-full ${phaseAccent[phase.kind]}`} />
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              {TRAINING_PHASE_LABELS[phase.kind]}
            </div>
            <h3 className="truncate text-base font-black">{phase.title}</h3>
          </div>
        </div>
        <div className="rounded-lg bg-[var(--surface-subtle)] px-3 py-1.5 text-sm font-bold">
          {duration} Min.
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {phase.items.map((item, index) => (
          <article className="grid gap-3 px-5 py-4 sm:grid-cols-[34px_minmax(0,1fr)_auto] sm:items-center" key={item.id}>
            <div className="grid size-8 place-items-center rounded-lg bg-[var(--surface-subtle)] text-xs font-black text-[var(--muted)]">
              {index + 1}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold">{item.exercise.name}</h4>
                {item.levelLabel ? (
                  <span className="rounded-md bg-[var(--surface-subtle)] px-2 py-0.5 text-xs font-bold text-[var(--muted)]">
                    {item.levelLabel}
                  </span>
                ) : null}
              </div>
              {item.instructions ? (
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{item.instructions}</p>
              ) : null}
            </div>
            <div className="text-sm font-black sm:text-right">{item.durationMinutes} Min.</div>
          </article>
        ))}
      </div>
    </section>
  );
}
