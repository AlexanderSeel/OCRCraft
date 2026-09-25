export const CODEX_IMAGE_P1_BATCHES = {
  "single-subject": [
    "ankle-rocker-mobility",
    "battle-rope-waves",
    "bear-plank-shoulder-tap",
    "chair-sit-to-stand",
    "crawl-to-stand-transition",
    "dead-bug-heel-tap",
    "hanging-knee-raise",
    "hanging-oblique-knee-raise",
    "hanging-pike",
    "hanging-straight-leg-raise",
    "hip-90-90-switch",
    "lateral-shuffle-stick",
    "quiet-landing-practice",
    "supported-side-plank-knee",
    "supported-single-leg-hinge",
    "thoracic-open-book",
    "wall-pushup",
  ],
  "ocrfra-obstacles": [
    "club-anchor-chain-drag",
    "club-balance-beam",
    "club-escaladierwand",
    "club-inverse-wall",
    "club-irish-table",
    "club-multirig-ring-traverse",
    "club-olympus",
    "club-rotating-rig-elements",
    "club-slackline",
    "club-tire-obstacle-transit",
    "club-weaver",
  ],
  "games-partner": [
    "cooperative-cone-collect",
    "game-carry-collect",
    "game-code-run",
    "game-color-island-sprint",
    "game-grip-token-hunt",
    "game-lava-path-builders",
    "game-ocr-memory-relay",
    "game-ocr-task-grid",
    "game-partner-pace-match",
    "game-reaction-gates",
    "game-route-puzzle",
    "game-team-treasure-carry",
    "game-zone-switch",
    "partner-mirror-movement",
  ],
} as const;

export type CodexImageP1BatchId = keyof typeof CODEX_IMAGE_P1_BATCHES;

export function isCodexImageP1BatchId(value: string): value is CodexImageP1BatchId {
  return Object.prototype.hasOwnProperty.call(CODEX_IMAGE_P1_BATCHES, value);
}

export function codexImageP1BatchSeedKeys(batchId: CodexImageP1BatchId): readonly string[] {
  return CODEX_IMAGE_P1_BATCHES[batchId];
}
