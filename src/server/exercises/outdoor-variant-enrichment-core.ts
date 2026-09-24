export interface ExerciseEquipmentSnapshot {
  readonly equipmentId: string;
  readonly seedKey: string;
  readonly nameDe: string;
  readonly nameEn: string;
  readonly quantityRequired: number;
}

export interface OutdoorVariantSubstitution {
  readonly original: ExerciseEquipmentSnapshot;
  readonly replacement: ExerciseEquipmentSnapshot | null;
}

export interface OutdoorVariantPlan {
  readonly equipment: readonly ExerciseEquipmentSnapshot[];
  readonly substitutions: readonly OutdoorVariantSubstitution[];
  readonly canApply: boolean;
}

export type OutdoorMovementFamily =
  | "pull"
  | "push"
  | "squat"
  | "hinge"
  | "lunge"
  | "carry"
  | "rotation"
  | "core"
  | "locomotion"
  | "generic";

export interface OutdoorMovementContext {
  readonly name?: string;
  readonly movementPatterns?: readonly string[];
}

const APPROVED_REPLACEMENT_CANDIDATES: Readonly<Record<string, readonly string[]>> = {
  cable: ["resistance-band"],
  "external-cable": ["resistance-band"],
  dumbbell: ["kettlebell", "sandbag"],
  "external-dumbbell": ["kettlebell"],
  barbell: ["sandbag"],
  "external-barbell": ["sandbag"],
  "external-olympic-barbell": ["sandbag"],
  "external-trap-bar": ["sandbag"],
  "ez-barbell": ["resistance-band"],
  "external-ez-barbell": ["resistance-band"],
  bench: ["box"],
  "external-bench": ["box"],
  "external-assisted": ["resistance-band"],
  "external-kettlebell": ["kettlebell"],
  "external-medicine-ball": ["medicine-ball"],
  "external-resistance-band": ["resistance-band"],
  "external-rope": ["rope"],
  "external-sled-machine": ["sled"],
  "external-tire": ["tire"],
  "external-box": ["box"],
  "external-mat": ["mat"],
};

const MANUAL_REVIEW_EQUIPMENT = new Set([
  "machine",
  "external-machine",
  "smith-machine",
  "external-smith-machine",
  "external-leverage-machine",
  "external-bosu-ball",
  "external-stability-ball",
  "external-wheel-roller",
  "external-hammer",
  "external-roller",
  "external-weighted",
]);

const SYSTEM_GENERIC_VARIANT_FRAGMENTS = [
  "Outdoor-Variante: Nutze Kettlebell, Sandbag, Widerstandsband, Matte oder Körpergewicht",
  "Outdoor variation: use kettlebell, sandbag, resistance band, mat or bodyweight",
] as const;

export function isGymBoundEquipment(seedKey: string): boolean {
  const normalized = seedKey.trim().toLowerCase();
  return Boolean(APPROVED_REPLACEMENT_CANDIDATES[normalized]) || MANUAL_REVIEW_EQUIPMENT.has(normalized);
}

export function isSystemGeneratedOutdoorVariant(text: string): boolean {
  const normalized = text.trim();
  return SYSTEM_GENERIC_VARIANT_FRAGMENTS.some((fragment) => normalized.startsWith(fragment));
}

export function buildOutdoorVariantPlan(
  current: readonly ExerciseEquipmentSnapshot[],
  catalogue: readonly ExerciseEquipmentSnapshot[],
): OutdoorVariantPlan {
  const catalogueBySeed = new Map(catalogue.map((item) => [item.seedKey, item]));
  const substitutions: OutdoorVariantSubstitution[] = [];
  const result = new Map<string, ExerciseEquipmentSnapshot>();

  for (const item of current) {
    const normalized = item.seedKey.trim().toLowerCase();
    if (!isGymBoundEquipment(normalized)) {
      result.set(item.equipmentId, item);
      continue;
    }

    const candidates = APPROVED_REPLACEMENT_CANDIDATES[normalized] ?? [];
    const baseReplacement = candidates.map((key) => catalogueBySeed.get(key)).find(Boolean) ?? null;
    const replacement = baseReplacement
      ? { ...baseReplacement, quantityRequired: Math.max(1, item.quantityRequired) }
      : null;
    substitutions.push({ original: item, replacement });
    if (replacement) result.set(replacement.equipmentId, replacement);
  }

  return {
    equipment: [...result.values()],
    substitutions,
    canApply: substitutions.length > 0 && substitutions.every((item) => item.replacement != null),
  };
}

export function buildPreconvertedOutdoorVariantPlan(
  current: readonly ExerciseEquipmentSnapshot[],
): OutdoorVariantPlan {
  return { equipment: current, substitutions: [], canApply: true };
}

export function inferOutdoorMovementFamily(context: OutdoorMovementContext = {}): OutdoorMovementFamily {
  const patterns = new Set((context.movementPatterns ?? []).map((item) => item.trim().toLowerCase()));
  if (patterns.has("pull") || patterns.has("hang")) return "pull";
  if (patterns.has("push")) return "push";
  if (patterns.has("squat")) return "squat";
  if (patterns.has("hinge")) return "hinge";
  if (patterns.has("lunge")) return "lunge";
  if (patterns.has("carry") || patterns.has("drag")) return "carry";
  if (patterns.has("rotate") || patterns.has("anti-rotate")) return "rotation";
  if (patterns.has("crawl") || patterns.has("locomotion") || patterns.has("run")) return "locomotion";

  const name = (context.name ?? "").trim().toLowerCase();
  if (/\b(row|pull|pulldown|pull-down|curl|chin[- ]?up)\b/.test(name)) return "pull";
  if (/\b(press|push|dip|triceps extension)\b/.test(name)) return "push";
  if (/\b(squat)\b/.test(name)) return "squat";
  if (/\b(deadlift|hinge|good morning|hip thrust|glute bridge)\b/.test(name)) return "hinge";
  if (/\b(lunge|split squat|step[- ]?up)\b/.test(name)) return "lunge";
  if (/\b(carry|farmer|drag|sled)\b/.test(name)) return "carry";
  if (/\b(rotation|rotate|twist|wood ?chop|pallof)\b/.test(name)) return "rotation";
  if (/\b(plank|crunch|sit[- ]?up|abdom|leg raise|rollout)\b/.test(name)) return "core";
  if (/\b(run|walk|crawl|bear crawl|sprint)\b/.test(name)) return "locomotion";
  return "generic";
}

export function outdoorVariantText(
  plan: OutdoorVariantPlan,
  locale: "de" | "en",
  context: OutdoorMovementContext = {},
): string {
  if (!plan.canApply) return "";
  const replacements = plan.substitutions.map(({ original, replacement }) => {
    const from = locale === "de" ? original.nameDe : original.nameEn;
    const to = locale === "de" ? replacement?.nameDe : replacement?.nameEn;
    return `${from} → ${to}`;
  });
  const equipment = plan.equipment
    .map((item) => locale === "de" ? item.nameDe : item.nameEn)
    .filter(Boolean)
    .join(", ");
  const family = inferOutdoorMovementFamily(context);
  const focus = movementFocus(family, locale);
  const replacementText = replacements.length > 0
    ? (locale === "de" ? `Ersetzung: ${replacements.join("; ")}. ` : `Substitution: ${replacements.join("; ")}. `)
    : "";
  return locale === "de"
    ? `Outdoor-Variante: ${replacementText}${focus} Verwende ${equipment || "kein Zusatzgerät"}. Last bzw. Bandspannung so wählen, dass Technik, kontrollierter Bewegungsumfang und die bestehenden Sicherheitskriterien stabil bleiben.`
    : `Outdoor variation: ${replacementText}${focus} Use ${equipment || "no additional equipment"}. Choose load or band tension so technique, controlled range of motion and the existing safety criteria remain stable.`;
}

function movementFocus(family: OutdoorMovementFamily, locale: "de" | "en"): string {
  const de: Record<OutdoorMovementFamily, string> = {
    pull: "Zugrichtung und Schulterblattkontrolle beibehalten; den Widerstand entlang derselben Zuglinie führen.",
    push: "Druckrichtung, Rumpfspannung und Schulterkontrolle beibehalten; den Widerstand entlang derselben Drucklinie führen.",
    squat: "Knie-/Hüftbeuge, Knieachse und stabile Rumpfposition beibehalten; portable Last körpernah führen.",
    hinge: "Hüftknick und neutrale Wirbelsäule beibehalten; die Last körpernah und kontrolliert bewegen.",
    lunge: "Schritt-/Ausfallschrittmuster, Knieachse und Beckenstabilität beibehalten; Last gleichmäßig kontrollieren.",
    carry: "Trage- bzw. Zugposition, aufrechte Rumpfkontrolle und kontrollierte Strecke beibehalten.",
    rotation: "Rotations- bzw. Anti-Rotationsrichtung und stabile Becken-/Rumpfkontrolle beibehalten.",
    core: "Rumpfspannung, Beckenposition und kontrollierte Atmung über den gesamten Bewegungsweg beibehalten.",
    locomotion: "Bewegungsrichtung, Rhythmus und kontrollierte Fuß-/Körperposition beibehalten.",
    generic: "Die ursprüngliche Bewegungsaufgabe und Widerstandsrichtung beibehalten.",
  };
  const en: Record<OutdoorMovementFamily, string> = {
    pull: "Keep the pulling direction and scapular control; apply resistance along the same pulling line.",
    push: "Keep the pressing direction, trunk tension and shoulder control; apply resistance along the same pressing line.",
    squat: "Keep the knee/hip bend, knee alignment and stable trunk position; keep portable load close to the body.",
    hinge: "Keep the hip hinge and neutral spine; move the load close to the body and under control.",
    lunge: "Keep the step/lunge pattern, knee alignment and pelvic stability; control the load evenly.",
    carry: "Keep the carry or drag position, upright trunk control and controlled distance.",
    rotation: "Keep the rotation or anti-rotation direction with stable pelvis and trunk control.",
    core: "Keep trunk tension, pelvic position and controlled breathing through the full movement range.",
    locomotion: "Keep the movement direction, rhythm and controlled foot/body position.",
    generic: "Keep the original movement task and resistance direction.",
  };
  return locale === "de" ? de[family] : en[family];
}
