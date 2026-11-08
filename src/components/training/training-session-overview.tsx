"use client";

import { useEffect, useRef } from "react";
import type { Audience, TrainingPhaseKind } from "@/domain/training/model";
import { useLocale } from "@/components/i18n/locale-provider";

interface PhaseOverview { readonly id: string; readonly kind: TrainingPhaseKind; readonly durationMinutes: number; }

export function TrainingSessionOverview({ phases, targetMinutes, audience, minAge, maxAge }: {
  readonly phases: readonly PhaseOverview[];
  readonly targetMinutes: number;
  readonly audience?: Audience;
  readonly minAge?: number;
  readonly maxAge?: number;
}) {
  const { dictionary } = useLocale();
  const copy = dictionary.trainingOverview;
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const panel = ref.current;
    const main = panel?.closest("main");
    const header = main?.parentElement?.querySelector<HTMLElement>(".app-header");
    if (!panel || !main || !header) return;
    const update = () => {
      main.style.setProperty("--training-header-height", `${header.getBoundingClientRect().height}px`);
      main.style.setProperty("--training-overview-height", `${panel.getBoundingClientRect().height}px`);
    };
    const observer = new ResizeObserver(update);
    observer.observe(header);
    observer.observe(panel);
    update();
    return () => {
      observer.disconnect();
      main.style.removeProperty("--training-header-height");
      main.style.removeProperty("--training-overview-height");
    };
  }, []);
  const plannedMinutes = phases.reduce((sum, phase) => sum + phase.durationMinutes, 0);
  const age = minAge != null && maxAge != null ? `${minAge}–${maxAge}` : minAge != null ? `${minAge}+` : maxAge != null ? `≤ ${maxAge}` : copy.unknown;

  return <section aria-label={copy.title} className="sticky top-[var(--training-header-height,0px)] z-10 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-3 shadow-[var(--shadow-card)]" data-testid="training-session-overview" ref={ref}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
      <h2 className="font-black">{copy.title}</h2>
      <p><strong>{copy.planned}: {plannedMinutes} {copy.minutes}</strong> · {copy.target}: {targetMinutes} {copy.minutes}</p>
    </div>
    <p className="mt-1 text-xs text-[var(--muted)]">{copy.audience}: {audience ? copy[audience] : copy.unknown} · {copy.age}: {age}</p>
    <nav aria-label={copy.title} className="mt-2 grid grid-cols-3 gap-1">
      {phases.map((phase) => <a className="flex min-h-11 min-w-0 flex-col justify-center rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--surface-subtle)]" href={`#phase-${phase.id}`} key={phase.id}>
        <span className="font-bold">{copy[phase.kind]}</span><span className="text-[var(--muted)]">{phase.durationMinutes} {copy.minutes}</span>
      </a>)}
    </nav>
  </section>;
}
