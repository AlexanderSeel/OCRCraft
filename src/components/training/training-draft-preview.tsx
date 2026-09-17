import type { TrainingDraft } from "@/domain/training/draft";
import type { TrainingItem, TrainingPhase, TrainingPhaseKind } from "@/domain/training/model";

export type DraftPreviewAlternativeMode = "easier" | "harder" | "equipment";

interface TrainingDraftPreviewProps {
  readonly draft: TrainingDraft;
  readonly onRegeneratePhase?: (phase: TrainingPhaseKind) => void;
  readonly regeneratingPhase?: TrainingPhaseKind | null;
  readonly onReplaceExercise?: (exerciseId: string, mode: DraftPreviewAlternativeMode) => void;
  readonly replacingExerciseId?: string | null;
}

interface MainPartBlock {
  readonly index: number;
  readonly title: string;
  readonly items: readonly TrainingItem[];
}

export function TrainingDraftPreview({
  draft,
  onRegeneratePhase,
  regeneratingPhase = null,
  onReplaceExercise,
  replacingExerciseId = null,
}: TrainingDraftPreviewProps) {
  const mainPartCount = Math.max(
    1,
    ...draft.session.phases
      .filter((phase) => phase.kind === "main")
      .flatMap((phase) => phase.items.map((item) => item.mainPartIndex ?? 1)),
  );
  const teamMode = draft.session.group.organizationMode === "team";
  const teamSize = teamMode ? Math.max(2, draft.session.group.teamSize ?? 2) : null;
  const teamCount = teamSize == null ? null : Math.ceil(draft.session.group.participantCount / teamSize);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            {draft.source === "ai" ? "AI-Vorschlag · deterministisch geprüft" : "Lokaler Sportalgorithmus"}
          </div>
          <h4 className="mt-1 text-lg font-black">
            {draft.session.totalDurationMinutes} Minuten · Warm-up + {mainPartCount} {mainPartCount === 1 ? "Hauptteil" : "Hauptteile"} + Cooldown
          </h4>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {teamMode && teamSize != null
              ? `Teamorganisation · Zielgröße ${teamSize} · ca. ${teamCount} Teams bei ${draft.session.group.participantCount} Teilnehmenden`
              : `Individuell / freie Rotation · ${draft.session.group.participantCount} Teilnehmende`}
          </p>
        </div>
        <span className="rounded-full border border-[var(--success-border)] bg-[var(--success-bg)] px-3 py-1 text-xs font-black text-[var(--success-foreground)]">
          {draft.validationIssues.length === 0 ? "Plan-Check sauber" : `${draft.validationIssues.length} Hinweise`}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {draft.session.phases.map((phase) => (
          <PhasePreview
            draft={draft}
            key={phase.id}
            onRegeneratePhase={onRegeneratePhase}
            onReplaceExercise={onReplaceExercise}
            phase={phase}
            regeneratingPhase={regeneratingPhase}
            replacingExerciseId={replacingExerciseId}
          />
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

function PhasePreview({
  draft,
  phase,
  onRegeneratePhase,
  regeneratingPhase,
  onReplaceExercise,
  replacingExerciseId,
}: {
  readonly draft: TrainingDraft;
  readonly phase: TrainingPhase;
  readonly onRegeneratePhase?: (phase: TrainingPhaseKind) => void;
  readonly regeneratingPhase: TrainingPhaseKind | null;
  readonly onReplaceExercise?: (exerciseId: string, mode: DraftPreviewAlternativeMode) => void;
  readonly replacingExerciseId: string | null;
}) {
  const mainBlocks = phase.kind === "main" ? groupMainParts(phase.items) : [];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h5 className="font-black">{phase.title}</h5>
          <span className="text-xs font-bold text-[var(--muted)]">
            {phase.items.reduce((sum, item) => sum + item.durationMinutes, 0)} Min.
            {phase.kind === "main" && mainBlocks.length > 1 ? ` · ${mainBlocks.length} Blöcke` : ""}
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

      {phase.kind === "main" ? (
        <div className="mt-3 space-y-3">
          {mainBlocks.map((block) => (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" key={block.index}>
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                <span className="text-xs font-black uppercase tracking-[0.08em]">{block.title}</span>
                <span className="text-[11px] font-bold text-[var(--muted)]">
                  {block.items.reduce((sum, item) => sum + item.durationMinutes, 0)} Min. · {block.items.length} Übungen
                </span>
              </div>
              <ol className="mt-2 space-y-2">
                {block.items.map((item) => (
                  <TrainingItemPreview
                    blockItems={block.items}
                    draft={draft}
                    item={item}
                    key={item.id}
                    onReplaceExercise={onReplaceExercise}
                    regeneratingPhase={regeneratingPhase}
                    replacingExerciseId={replacingExerciseId}
                  />
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <ol className="mt-3 space-y-2">
          {phase.items.map((item) => (
            <TrainingItemPreview
              blockItems={phase.items}
              draft={draft}
              item={item}
              key={item.id}
              onReplaceExercise={onReplaceExercise}
              regeneratingPhase={regeneratingPhase}
              replacingExerciseId={replacingExerciseId}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function TrainingItemPreview({
  draft,
  item,
  blockItems,
  onReplaceExercise,
  replacingExerciseId,
  regeneratingPhase,
}: {
  readonly draft: TrainingDraft;
  readonly item: TrainingItem;
  readonly blockItems: readonly TrainingItem[];
  readonly onReplaceExercise?: (exerciseId: string, mode: DraftPreviewAlternativeMode) => void;
  readonly replacingExerciseId: string | null;
  readonly regeneratingPhase: TrainingPhaseKind | null;
}) {
  const participantsAtExercise = participantsAtItem(draft, item, blockItems);
  const capacityExceeded = item.exercise.stationCapacity != null
    && item.exercise.stationCapacity > 0
    && participantsAtExercise > item.exercise.stationCapacity;
  const replacing = replacingExerciseId === item.exercise.id;

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-black">{item.exercise.name}</span>
        <span className="shrink-0 text-xs font-bold text-[var(--muted)]">{item.durationMinutes} Min.</span>
      </div>
      <div className="mt-1 text-xs text-[var(--muted)]">
        {item.format ?? "free"}
        {item.exercise.equipment.length ? ` · ${item.exercise.equipment.join(", ")}` : ""}
      </div>
      {item.exercise.stationCapacity != null && item.exercise.stationCapacity > 0 ? (
        <p
          className={`mt-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${capacityExceeded
            ? "bg-[var(--warning-bg)] text-[var(--warning)]"
            : "bg-[var(--surface-subtle)] text-[var(--muted)]"
          }`}
          role={capacityExceeded ? "note" : undefined}
        >
          Max. {item.exercise.stationCapacity} gleichzeitig pro Station · geplant bis zu {participantsAtExercise}
          {capacityExceeded ? " · Rotation, parallele Stationen oder kleinere Teams einplanen" : ""}
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
}

function groupMainParts(items: readonly TrainingItem[]): readonly MainPartBlock[] {
  const groups = new Map<number, TrainingItem[]>();
  const titles = new Map<number, string>();
  for (const item of items) {
    const index = Number.isInteger(item.mainPartIndex) && (item.mainPartIndex ?? 0) > 0
      ? item.mainPartIndex as number
      : 1;
    const entries = groups.get(index) ?? [];
    entries.push(item);
    groups.set(index, entries);
    if (!titles.has(index)) titles.set(index, item.mainPartTitle?.trim() || `Hauptteil ${index}`);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([index, blockItems]) => ({
      index,
      title: titles.get(index) ?? `Hauptteil ${index}`,
      items: blockItems,
    }));
}

function participantsAtItem(
  draft: TrainingDraft,
  item: TrainingItem,
  blockItems: readonly TrainingItem[],
): number {
  const participantCount = Math.max(1, draft.session.group.participantCount);
  const teamMode = draft.session.group.organizationMode === "team" && (draft.session.group.teamSize ?? 0) >= 2;
  if (teamMode) {
    return Math.min(participantCount, Math.max(2, draft.session.group.teamSize ?? 2));
  }
  if (item.format !== "circuit") return participantCount;
  const circuitStationCount = blockItems.filter((candidate) => candidate.format === "circuit").length;
  return Math.ceil(participantCount / Math.max(1, circuitStationCount));
}
