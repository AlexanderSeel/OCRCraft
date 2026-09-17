import type { TrainingDraft } from "@/domain/training/draft";
import type { TrainingPhaseKind } from "@/domain/training/model";

export type DraftPreviewAlternativeMode = "easier" | "harder" | "equipment";

interface TrainingDraftPreviewProps {
  readonly draft: TrainingDraft;
  readonly onRegeneratePhase?: (phase: TrainingPhaseKind) => void;
  readonly regeneratingPhase?: TrainingPhaseKind | null;
  readonly onReplaceExercise?: (exerciseId: string, mode: DraftPreviewAlternativeMode) => void;
  readonly replacingExerciseId?: string | null;
}

export function TrainingDraftPreview({
  draft,
  onRegeneratePhase,
  regeneratingPhase = null,
  onReplaceExercise,
  replacingExerciseId = null,
}: TrainingDraftPreviewProps) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            {draft.source === "ai" ? "AI-Vorschlag · deterministisch geprüft" : "Lokaler Sportalgorithmus"}
          </div>
          <h4 className="mt-1 text-lg font-black">{draft.session.totalDurationMinutes} Minuten · 3 Phasen</h4>
        </div>
        <span className="rounded-full border border-[var(--success-border)] bg-[var(--success-bg)] px-3 py-1 text-xs font-black text-[var(--success-foreground)]">
          {draft.validationIssues.length === 0 ? "Plan-Check sauber" : `${draft.validationIssues.length} Hinweise`}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {draft.session.phases.map((phase) => (
          <section
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4"
            key={phase.id}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h5 className="font-black">{phase.title}</h5>
                <span className="text-xs font-bold text-[var(--muted)]">
                  {phase.items.reduce((sum, item) => sum + item.durationMinutes, 0)} Min.
                </span>
              </div>
              {onRegeneratePhase ? (
                <button
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] font-black hover:bg-[var(--surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={regeneratingPhase != null || replacingExerciseId != null}
                  onClick={() => onRegeneratePhase(phase.kind)}
                  type="button"
                >
                  {regeneratingPhase === phase.kind ? "Plane …" : "Neu planen"}
                </button>
              ) : null}
            </div>
            <ol className="mt-3 space-y-2">
              {phase.items.map((item) => {
                const circuitStationCount = phase.items.filter((phaseItem) => phaseItem.format === "circuit").length;
                const participantsAtExercise = item.format === "circuit"
                  ? Math.ceil(draft.session.group.participantCount / Math.max(1, circuitStationCount))
                  : draft.session.group.participantCount;
                const capacityExceeded = item.exercise.stationCapacity != null &&
                  participantsAtExercise > item.exercise.stationCapacity;
                const replacing = replacingExerciseId === item.exercise.id;

                return (
                  <li
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-black">{item.exercise.name}</span>
                      <span className="shrink-0 text-xs font-bold text-[var(--muted)]">{item.durationMinutes} Min.</span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {item.format ?? "free"}
                      {item.exercise.equipment.length ? ` · ${item.exercise.equipment.join(", ")}` : ""}
                    </div>
                    {phase.kind === "main" && item.exercise.stationCapacity != null && item.exercise.stationCapacity > 0 ? (
                      <p
                        className={`mt-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${capacityExceeded
                          ? "bg-[var(--warning-bg)] text-[var(--warning)]"
                          : "bg-[var(--surface-subtle)] text-[var(--muted)]"
                        }`}
                        role={capacityExceeded ? "note" : undefined}
                      >
                        Max. {item.exercise.stationCapacity} gleichzeitig pro Station
                        {capacityExceeded ? " · Gruppenrotation oder parallele Stationen einplanen" : ""}
                      </p>
                    ) : null}
                    {item.levelLabel ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{item.levelLabel}</p>
                    ) : null}
                    {onReplaceExercise ? (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-2">
                        <span className="mr-1 self-center text-[10px] font-black uppercase tracking-[0.08em] text-[var(--muted)]">
                          Alternative
                        </span>
                        {([
                          ["easier", "Leichter"],
                          ["harder", "Schwerer"],
                          ["equipment", "Weniger Equipment"],
                        ] as const).map(([mode, label]) => (
                          <button
                            className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-1 text-[10px] font-black hover:bg-[var(--surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={replacingExerciseId != null || regeneratingPhase != null}
                            key={mode}
                            onClick={() => onReplaceExercise(item.exercise.id, mode)}
                            type="button"
                          >
                            {replacing ? "Suche …" : label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {draft.warnings.length > 0 || draft.validationIssues.length > 0 ? (
        <div className="rounded-xl border border-[var(--warning)] bg-[var(--warning-bg)] p-4 text-sm">
          <div className="font-black">Planungshinweise</div>
          <ul className="mt-2 space-y-1 text-[var(--foreground)]">
            {draft.warnings.map((warning) => <li key={warning}>• {warning}</li>)}
            {draft.validationIssues.map((issue) => <li key={`${issue.code}-${issue.path ?? issue.message}`}>• {issue.message}</li>)}
          </ul>
        </div>
      ) : null}

      <p className="text-xs leading-5 text-[var(--muted)]">
        Dieser Entwurf ist noch nicht gespeichert. Er wird ausschließlich aus freigegebenen Bibliotheksdaten zusammengesetzt; AI-Vorschläge durchlaufen zusätzlich dieselben deterministischen OCRCraft-Prüfungen wie lokale Entwürfe.
      </p>
    </div>
  );
}
