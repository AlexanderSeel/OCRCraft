export type LegacyMediaMigrationState =
  | "needs_generation"
  | "generating"
  | "review_pending"
  | "ready_to_finalize";

export function getLegacyMediaMigrationState(input: {
  readonly activeJobCount: number;
  readonly pendingSequenceCount: number;
  readonly approvedSequenceCount: number;
}): LegacyMediaMigrationState {
  if (input.approvedSequenceCount > 0) return "ready_to_finalize";
  if (input.activeJobCount > 0) return "generating";
  if (input.pendingSequenceCount > 0) return "review_pending";
  return "needs_generation";
}

export function legacyMediaMigrationStateLabel(state: LegacyMediaMigrationState): string {
  if (state === "ready_to_finalize") return "Sequenz freigegeben";
  if (state === "generating") return "Sequenz wird erzeugt";
  if (state === "review_pending") return "Sequenz wartet auf Review";
  return "Sequenz fehlt";
}
