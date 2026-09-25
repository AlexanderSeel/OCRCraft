import details from "./muscle-details.json";

export const COARSE_BODY_REGION_IDS = [
  "full-body",
  "neck",
  "traps",
  "shoulders",
  "rear-delts",
  "chest",
  "upper-back",
  "lats",
  "upper-arms",
  "biceps",
  "triceps",
  "forearms-grip",
  "core",
  "abs",
  "obliques",
  "serratus",
  "lower-back",
  "hips",
  "glutes",
  "quadriceps",
  "hamstrings",
  "adductors",
  "calves",
  "tibialis",
  "ankles-feet",
] as const;

export type CoarseBodyRegion = (typeof COARSE_BODY_REGION_IDS)[number];
export type DetailBodyRegion = `detail:${string}`;
export type BodyRegion = CoarseBodyRegion | DetailBodyRegion;

/**
 * The pinned body-muscles catalogue describes physical source regions. Training
 * semantics are intentionally kept separate so one raster part can move between
 * trainer-facing groups without changing its stable upstream/detail identity.
 */
const DETAIL_PARENT_OVERRIDES: Readonly<Partial<Record<string, CoarseBodyRegion>>> = {
  "serratus-anterior-left": "serratus",
  "serratus-anterior-right": "serratus",
};

export const DETAIL_BODY_REGION_OPTIONS = details.map(detail => ({
  ...detail,
  id: detail.id as DetailBodyRegion,
  parentId: (DETAIL_PARENT_OVERRIDES[detail.sourceId] ?? detail.parentId) as CoarseBodyRegion,
}));
export const BODY_REGION_IDS: readonly BodyRegion[] = [...COARSE_BODY_REGION_IDS, ...DETAIL_BODY_REGION_OPTIONS.map(d => d.id)];
export function detailBodyRegion(id: string) { return DETAIL_BODY_REGION_OPTIONS.find(d => d.id === id); }
export function bodyRegionParent(id: string): string { return detailBodyRegion(id)?.parentId ?? id; }

interface BodyRegionLabels {
  readonly labelDe: string;
  readonly labelEn: string;
}

const BODY_REGION_LABELS: Readonly<Record<CoarseBodyRegion, BodyRegionLabels>> = {
  "full-body": { labelDe: "Ganzkörper", labelEn: "Full Body" },
  neck: { labelDe: "Nacken", labelEn: "Neck" },
  traps: { labelDe: "Trapezmuskel", labelEn: "Trapezius" },
  shoulders: { labelDe: "Schultern", labelEn: "Shoulders" },
  "rear-delts": { labelDe: "Hintere Schulter", labelEn: "Rear Deltoids" },
  chest: { labelDe: "Brust", labelEn: "Chest" },
  "upper-back": { labelDe: "Oberer Rücken", labelEn: "Upper Back" },
  lats: { labelDe: "Latissimus", labelEn: "Lats" },
  "upper-arms": { labelDe: "Oberarme", labelEn: "Upper Arms" },
  biceps: { labelDe: "Bizeps", labelEn: "Biceps" },
  triceps: { labelDe: "Trizeps", labelEn: "Triceps" },
  "forearms-grip": { labelDe: "Unterarme / Grip", labelEn: "Forearms / Grip" },
  core: { labelDe: "Core", labelEn: "Core" },
  abs: { labelDe: "Bauchmuskulatur", labelEn: "Abdominals" },
  obliques: { labelDe: "Seitlicher Core", labelEn: "Obliques" },
  serratus: { labelDe: "Vorderer Sägemuskel", labelEn: "Serratus Anterior" },
  "lower-back": { labelDe: "Unterer Rücken", labelEn: "Lower Back" },
  hips: { labelDe: "Hüfte", labelEn: "Hips" },
  glutes: { labelDe: "Gesäß", labelEn: "Glutes" },
  quadriceps: { labelDe: "Oberschenkel vorn", labelEn: "Quadriceps" },
  hamstrings: { labelDe: "Oberschenkel hinten", labelEn: "Hamstrings" },
  adductors: { labelDe: "Adduktoren", labelEn: "Adductors" },
  calves: { labelDe: "Waden", labelEn: "Calves" },
  tibialis: { labelDe: "Schienbein / Tibialis", labelEn: "Tibialis Anterior" },
  "ankles-feet": { labelDe: "Sprunggelenke / Füße", labelEn: "Ankles / Feet" },
};

export const BODY_REGION_OPTIONS = [...COARSE_BODY_REGION_IDS.map((id) => ({
  id: id as BodyRegion,
  ...BODY_REGION_LABELS[id],
})), ...DETAIL_BODY_REGION_OPTIONS];

const BODY_REGION_SET = new Set<string>(BODY_REGION_IDS);

const LEGACY_BODY_REGION_ALIASES: Readonly<Record<string, BodyRegion>> = {
  arms: "upper-arms",
};

const COMPATIBLE_BODY_REGIONS: Readonly<Partial<Record<BodyRegion, readonly BodyRegion[]>>> = {
  shoulders: ["rear-delts"],
  "rear-delts": ["shoulders"],
  "upper-back": ["traps", "lats"],
  traps: ["upper-back"],
  lats: ["upper-back"],
  "upper-arms": ["biceps", "triceps"],
  biceps: ["upper-arms"],
  triceps: ["upper-arms"],
  core: ["abs", "obliques", "serratus"],
  abs: ["core"],
  obliques: ["core"],
  serratus: ["core"],
};

const CHILD_GROUPS: Readonly<Partial<Record<BodyRegion, readonly BodyRegion[]>>> = {
  "upper-arms": ["biceps", "triceps"], core: ["abs", "obliques", "serratus"],
  "upper-back": ["traps", "lats"], shoulders: ["rear-delts"],
};

/**
 * Typical training counterparts for antagonist-oriented programming.
 * These are deliberately conservative body-region relationships, not a claim
 * that every movement involving one region has exactly this antagonist.
 */
const ANTAGONIST_BODY_REGIONS: Readonly<Partial<Record<BodyRegion, readonly BodyRegion[]>>> = {
  biceps: ["triceps"],
  triceps: ["biceps"],
  chest: ["upper-back", "lats"],
  "upper-back": ["chest"],
  lats: ["chest"],
  shoulders: ["rear-delts"],
  "rear-delts": ["shoulders"],
  core: ["lower-back"],
  abs: ["lower-back"],
  "lower-back": ["abs", "core"],
  hips: ["glutes"],
  glutes: ["hips"],
  quadriceps: ["hamstrings"],
  hamstrings: ["quadriceps"],
  calves: ["tibialis"],
  tibialis: ["calves"],
};

export function isBodyRegion(value: string): value is BodyRegion {
  return BODY_REGION_SET.has(value);
}

export function normalizeBodyRegionId(value: string): BodyRegion | null {
  const normalized = value.trim();
  if (isBodyRegion(normalized)) return normalized;
  return LEGACY_BODY_REGION_ALIASES[normalized] ?? null;
}

/**
 * Expands a requested region with only safe broad/fine compatibility mappings.
 * This lets older exercise mappings remain useful without inventing detailed
 * anatomy that was never stored on the exercise itself.
 */
export function expandBodyRegionIds(values: readonly string[]): readonly BodyRegion[] {
  const expanded = new Set<BodyRegion>();

  for (const value of values) {
    const region = normalizeBodyRegionId(value);
    if (!region) continue;
    expanded.add(region);
    const detail = detailBodyRegion(region);
    if (detail) {
      // Coarse records can match a detail filter, but opposite sides and heads cannot.
      expanded.add(detail.parentId);
      for (const compatible of COMPATIBLE_BODY_REGIONS[detail.parentId] ?? []) expanded.add(compatible);
    } else {
      const parents = [region, ...(COMPATIBLE_BODY_REGIONS[region] ?? [])];
      for (const compatible of parents) expanded.add(compatible);
      for (const child of DETAIL_BODY_REGION_OPTIONS) {
        if (child.parentId === region || CHILD_GROUPS[region]?.includes(child.parentId)) expanded.add(child.id);
      }
    }
  }

  return [...expanded];
}

export function getBodyRegionAntagonists(value: string): readonly BodyRegion[] {
  const normalized = normalizeBodyRegionId(value);
  if (!normalized) return [];
  return ANTAGONIST_BODY_REGIONS[bodyRegionParent(normalized) as BodyRegion] ?? [];
}

export function bodyRegionsOverlap(
  selectedRegions: readonly string[],
  candidateRegions: readonly string[],
): boolean {
  const requested = new Set(expandBodyRegionIds(selectedRegions));
  if (requested.size === 0) return false;

  return candidateRegions.some((value) => {
    const normalized = normalizeBodyRegionId(value);
    return normalized ? requested.has(normalized) : false;
  });
}
