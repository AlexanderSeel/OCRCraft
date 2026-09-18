import { TrainingItemGuidance } from "@/components/training/training-item-guidance";
import { TRAINING_PHASE_LABELS } from "@/domain/training/model";
import { mainPartProgrammingLabel } from "@/server/training/main-part-programming";
import { analyzeMainPartProgramming } from "@/domain/training/programming-math";
import type { TrainingExerciseGuidanceMap } from "@/server/training/training-exercise-guidance-repository";
import type { TrainingSessionDetail } from "@/server/training/training-session-repository";

interface TrainingReadonlySessionProps {
  readonly session: TrainingSessionDetail;
  readonly guidanceByExerciseId: TrainingExerciseGuidanceMap;
  readonly presentation?: "trainer" | "print";
}

export function TrainingReadonlySession({
  session,
  guidanceByExerciseId,
  presentation = "trainer",
}: TrainingReadonlySessionProps) {
  const printMode = presentation === "print";

  return (
    <div className={printMode ? "space-y-5" : "space-y-6"}>
      <header className={printMode
        ? "border-b border-slate-300 pb-4"
        : "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6"}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className={printMode
              ? "text-xs font-bold uppercase tracking-[0.14em] text-slate-500"
              : "text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]"}
            >
              OCRCraft Training
            </div>
            <h1 className={printMode ? "mt-1 text-2xl font-black" : "mt-1 text-3xl font-black"}>
              {session.title}
            </h1>
          </div>
          <div className={printMode
            ? "text-right text-sm font-bold text-slate-600"
            : "text-right text-sm font-bold text-[var(--muted)]"}
          >
            <div>{session.totalDurationMinutes} Minuten</div>
            <div>{session.itemCount} Übungen</div>
          </div>
        </div>
        {session.notes ? (
          <p className={printMode ? "mt-3 text-sm leading-6 text-slate-700" : "mt-3 text-sm leading-6 text-[var(--muted)]"}>
            {session.notes}
          </p>
        ) : null}
        {session.trainerProfile ? (
          <div className={printMode ? "mt-4 flex items-center gap-3 text-sm text-slate-600" : "mt-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--muted)]"}>
            {session.trainerProfile.imageDataUrl || session.trainerProfile.imageUri ? <img alt="" className="size-10 rounded-full object-cover" src={session.trainerProfile.imageDataUrl ?? session.trainerProfile.imageUri ?? ""} /> : <div aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-[var(--surface-elevated)] font-black">{initials(session.trainerProfile.name)}</div>}
            <div><div className={printMode ? "font-black text-slate-900" : "font-black text-[var(--foreground)]"}>{session.trainerProfile.name}</div><div>{[session.trainerProfile.education, session.trainerProfile.specialties].filter(Boolean).join(" · ") || "Trainerprofil"}</div></div>
          </div>
        ) : null}
      </header>

      {session.phases.map((phase) => (
        <section
          className={printMode
            ? "break-inside-avoid border-b border-slate-200 pb-5"
            : "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6"}
          key={phase.id}
        >
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <div className={printMode
                ? "text-xs font-bold uppercase tracking-[0.12em] text-slate-500"
                : "text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]"}
              >
                {TRAINING_PHASE_LABELS[phase.kind]}
              </div>
              <h2 className={printMode ? "mt-1 text-lg font-black" : "mt-1 text-2xl font-black"}>{phase.title}</h2>
            </div>
            <div className={printMode ? "text-sm font-bold text-slate-600" : "text-sm font-bold text-[var(--muted)]"}>
              {phase.items.reduce((sum, item) => sum + item.durationMinutes, 0)} Min.
            </div>
          </div>

          <div className={printMode ? "space-y-3" : "grid gap-3"}>
            {phase.items.map((item, index) => {
              const previous = phase.items[index - 1];
              const beginsMainPart = phase.kind === "main"
                && (index === 0 || (previous?.mainPartIndex ?? 1) !== (item.mainPartIndex ?? 1));
              const mainPartItems = beginsMainPart
                ? phase.items.filter((candidate) => (candidate.mainPartIndex ?? 1) === (item.mainPartIndex ?? 1))
                : [];
              const analysis = beginsMainPart && item.programming
                ? analyzeMainPartProgramming(
                    item.programming,
                    mainPartItems.reduce((sum, candidate) => sum + candidate.durationMinutes * 60, 0),
                    mainPartItems.length,
                  )
                : null;
              return (
                <div key={item.id}>
                  {beginsMainPart ? (
                    <div className={printMode
                      ? "mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-600"
                      : "mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-bold text-[var(--muted)]"}
                    >
                      <span>{item.mainPartTitle ?? `Hauptteil ${item.mainPartIndex ?? 1}`}</span>
                      {item.programming && (item.programming.mode !== "standard" || item.programming.partnerMode) ? (
                        <span className="text-right">
                          <span className="block">{mainPartProgrammingLabel(item.programming)}</span>
                          {analysis?.summary ? <span className="mt-0.5 block font-semibold opacity-80">{analysis.summary}</span> : null}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <article
                    className={printMode
                      ? "break-inside-avoid rounded-lg border border-slate-300 p-3"
                      : "rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:p-5"}
                  >
                    <div className="grid gap-3 sm:grid-cols-[38px_minmax(0,1fr)_auto]">
                      <div className={printMode
                        ? "grid size-8 place-items-center rounded-full border border-slate-300 text-sm font-black"
                        : "grid size-9 place-items-center rounded-full bg-[var(--surface)] text-sm font-black ring-1 ring-[var(--border)]"}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className={printMode ? "text-base font-black" : "text-lg font-black"}>{item.exerciseName}</div>
                        <div className={printMode
                          ? "mt-1 flex flex-wrap gap-2 text-xs font-bold text-slate-500"
                          : "mt-1 flex flex-wrap gap-2 text-xs font-bold text-[var(--muted)]"}
                        >
                          {item.format ? <span>{item.format}</span> : null}
                          {item.levelLabel ? <span>· {item.levelLabel}</span> : null}
                        </div>
                        <TrainingItemGuidance
                          guidance={item.exerciseId ? guidanceByExerciseId[item.exerciseId] : undefined}
                          trainerInstructions={item.instructions}
                        />
                      </div>
                      <div className="font-black">{item.durationMinutes} Min.</div>
                    </div>
                  </article>
                </div>
              );
            })}
            {phase.items.length === 0 ? (
              <div className={printMode ? "text-sm text-slate-500" : "text-sm text-[var(--muted)]"}>Keine Übungen.</div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : parts[0]?.[0] ?? "?").toUpperCase();
}
