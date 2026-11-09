import { TrainingPrintMasthead } from "./training-print-masthead";
import { TrainingPrintGuidance } from "./training-print-guidance";
import styles from "./training-print.module.css";
import { TrainingNotes } from "./training-notes";
import { TrainingItemGuidance } from "@/components/training/training-item-guidance";
import { TRAINING_PHASE_LABELS } from "@/domain/training/model";
import { mainPartProgrammingLabel } from "@/server/training/main-part-programming";
import { analyzeMainPartProgramming } from "@/domain/training/programming-math";
import type { TrainingExerciseGuidanceMap } from "@/server/training/training-exercise-guidance-repository";
import type { TrainingSessionDetail } from "@/server/training/training-session-repository";
import { ImageLightbox } from "@/components/ui/image-lightbox";

interface TrainingReadonlySessionProps {
  readonly session: TrainingSessionDetail;
  readonly guidanceByExerciseId: TrainingExerciseGuidanceMap;
  readonly presentation?: "trainer" | "print";
  readonly printDetail?: "compact" | "full";
}

export function TrainingReadonlySession({
  session,
  guidanceByExerciseId,
  presentation = "trainer",
  printDetail = "compact",
}: TrainingReadonlySessionProps) {
  const printMode = presentation === "print";

  return (
    <div className={printMode ? styles.sheet : "space-y-6"}>
      <header className={printMode
        ? styles.header
        : "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6"}
      >
        {printMode ? <TrainingPrintMasthead locale={session.locale} /> : null}
        <div className={printMode ? styles.titleRow : "flex flex-wrap items-start justify-between gap-4"}>
          <div>
            <div className={printMode
              ? styles.eyebrow
              : "text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]"}
            >
              {printMode ? (session.locale === "en" ? "Training session" : "Trainingseinheit") : "OCRCraft Training"}
            </div>
            <h1 className={printMode ? styles.title : "mt-1 text-3xl font-black"}>
              {session.title}
            </h1>
          </div>
          <div className={printMode
            ? styles.totals
            : "text-right text-sm font-bold text-[var(--muted)]"}
          >
            <div>{session.totalDurationMinutes} {session.locale === "en" ? "minutes" : "Minuten"}</div>
            <div>{session.itemCount} {session.locale === "en" ? "exercises" : "Übungen"}</div>
          </div>
        </div>
        {session.notes ? (
          <div className={printMode ? styles.notes : "mt-3 text-sm leading-6 text-[var(--muted)]"}>
            <TrainingNotes notes={session.notes} />
          </div>
        ) : null}
        {session.trainerProfile ? (
          <div className={printMode ? "mt-4 flex items-center gap-3 text-sm text-[var(--muted)]" : "mt-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--muted)]"}>
            {session.trainerProfile.imageDataUrl || session.trainerProfile.imageUri ? <ImageLightbox alt={`Profilbild: ${session.trainerProfile.name}`} className="size-10 rounded-full object-cover" containerClassName="relative size-10 overflow-hidden rounded-full" src={session.trainerProfile.imageDataUrl ?? session.trainerProfile.imageUri ?? ""} /> : <div aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-[var(--surface-elevated)] font-black">{initials(session.trainerProfile.name)}</div>}
            <div><div className={printMode ? "font-black text-[var(--foreground)]" : "font-black text-[var(--foreground)]"}>{session.trainerProfile.name}</div><div>{[session.trainerProfile.education, session.trainerProfile.specialties].filter(Boolean).join(" · ") || "Trainerprofil"}</div></div>
          </div>
        ) : null}
      </header>

      {session.phases.map((phase, phaseIndex) => (
        <section
          className={printMode
            ? styles.phase
            : "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6"}
          key={phase.id}
        >
          <div className={printMode ? styles.phaseHeading : "mb-4 flex flex-wrap items-baseline justify-between gap-3"}>
            <div className={printMode ? styles.phaseName : undefined}>
              {printMode ? <span className={styles.phaseNumber} aria-hidden="true">{String(phaseIndex + 1).padStart(2, "0")}</span> : null}
              <div>
              <div className={printMode
                ? styles.phaseLabel
                : "text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]"}
              >
                {TRAINING_PHASE_LABELS[phase.kind]}
              </div>
              <h2 className={printMode ? styles.phaseTitle : "mt-1 text-2xl font-black"}>{phase.title}</h2>
              </div>
            </div>
            <div className={printMode ? styles.duration : "text-sm font-bold text-[var(--muted)]"}>
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
                      ? styles.blockHeading
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
                      ? styles.item
                      : "rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:p-5"}
                  >
                    <div className={printMode ? styles.itemGrid : "grid gap-3 sm:grid-cols-[38px_minmax(0,1fr)_auto]"}>
                      <div className={printMode
                        ? styles.itemNumber
                        : "grid size-9 place-items-center rounded-full bg-[var(--surface)] text-sm font-black ring-1 ring-[var(--border)]"}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className={printMode ? styles.itemTitle : "text-lg font-black"}>{item.exerciseName}</div>
                        <div className={printMode
                          ? styles.itemMeta
                          : "mt-1 flex flex-wrap gap-2 text-xs font-bold text-[var(--muted)]"}
                        >
                          {item.format ? <span>{item.format}</span> : null}
                          {item.levelLabel ? <span>· {item.levelLabel}</span> : null}
                        </div>
                        {printMode && printDetail === "compact" ? <TrainingPrintGuidance
                          guidance={item.exerciseId ? guidanceByExerciseId[item.exerciseId] : undefined}
                          trainerInstructions={item.instructions}
                          locale={session.locale}
                        /> : <TrainingItemGuidance
                          expanded={printMode}
                          guidance={item.exerciseId ? guidanceByExerciseId[item.exerciseId] : undefined}
                          trainerInstructions={item.instructions}
                        />}
                      </div>
                      <div className="font-black">{item.durationMinutes} Min.</div>
                    </div>
                  </article>
                </div>
              );
            })}
            {phase.items.length === 0 ? (
              <div className={printMode ? "text-sm text-[var(--muted)]" : "text-sm text-[var(--muted)]"}>Keine Übungen.</div>
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
