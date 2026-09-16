import type { TrainingDraft } from "@/domain/training/draft";

interface TrainingDraftPreviewProps {
  readonly draft: TrainingDraft;
}

export function TrainingDraftPreview({ draft }: TrainingDraftPreviewProps) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Deterministischer Entwurf
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
            <div className="flex items-baseline justify-between gap-2">
              <h5 className="font-black">{phase.title}</h5>
              <span className="text-xs font-bold text-[var(--muted)]">
                {phase.items.reduce((sum, item) => sum + item.durationMinutes, 0)} Min.
              </span>
            </div>
            <ol className="mt-3 space-y-2">
              {phase.items.map((item) => (
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
                      className={`mt-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                        draft.session.group.participantCount > item.exercise.stationCapacity
                          ? "bg-[var(--warning-bg)] text-[var(--warning)]"
                          : "bg-[var(--surface-subtle)] text-[var(--muted)]"
                      }`}
                      role={draft.session.group.participantCount > item.exercise.stationCapacity ? "note" : undefined}
                    >
                      Max. {item.exercise.stationCapacity} gleichzeitig pro Station
                      {draft.session.group.participantCount > item.exercise.stationCapacity
                        ? " · Gruppenrotation oder parallele Stationen einplanen"
                        : ""}
                    </p>
                  ) : null}
                  {item.levelLabel ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{item.levelLabel}</p>
                  ) : null}
                </li>
              ))}
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
        Dieser Entwurf ist noch nicht gespeichert. Er wird ausschließlich aus freigegebenen Bibliotheksdaten und deterministischen Regeln zusammengesetzt.
      </p>
    </div>
  );
}
