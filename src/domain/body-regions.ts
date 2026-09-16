export const BODY_REGION_IDS = [
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

export type BodyRegion = (typeof BODY_REGION_IDS)[number];

interface BodyRegionLabels {
  readonly labelDe: string;
  readonly labelEn: string;
}

const BODY_REGION_LABELS: Readonly<Record<BodyRegion, BodyRegionLabels>> = {
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

export const BODY_REGION_OPTIONS = BODY_REGION_IDS.map((id) => ({
  id,
  ...BODY_REGION_LABELS[id],
}));

const BODY_REGION_SET = new Set<string>(BODY_REGION_IDS);
const BODY_REGION_ORDER = new Map<string, number>(BODY_REGION_IDS.map((id, index) => [id, index]));

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
  core: ["abs", "obliques"],
  abs: ["core"],
  obliques: ["core"],
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
    for (const compatible of COMPATIBLE_BODY_REGIONS[region] ?? []) {
      expanded.add(compatible);
    }
  }

  return [...expanded];
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

export function bodyRegionSortIndex(id: string): number {
  return BODY_REGION_ORDER.get(normalizeBodyRegionId(id) ?? id) ?? Number.MAX_SAFE_INTEGER;
}
