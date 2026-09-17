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

const REPLACEMENT_CANDIDATES: Readonly<Record<string, readonly string[]>> = {
  machine: ["resistance-band", "bodyweight"],
  cable: ["resistance-band"],
  dumbbell: ["kettlebell", "sandbag", "resistance-band"],
  barbell: ["sandbag", "kettlebell", "resistance-band"],
  bench: ["box", "bodyweight"],
  "smith-machine": ["resistance-band", "sandbag", "bodyweight"],
  "ez-barbell": ["resistance-band", "sandbag"],
};

export function isGymBoundEquipment(seedKey: string): boolean {
  const normalized = seedKey.trim().toLowerCase();
  return Boolean(REPLACEMENT_CANDIDATES[normalized])
    || normalized.includes("machine")
    || normalized.includes("cable")
    || normalized.includes("barbell")
    || normalized.includes("dumbbell")
    || normalized.includes("bench");
}

export function buildOutdoorVariantPlan(
  current: readonly ExerciseEquipmentSnapshot[],
  catalogue: readonly ExerciseEquipmentSnapshot[],
): OutdoorVariantPlan {
  const catalogueBySeed = new Map(catalogue.map((item) => [item.seedKey, item]));
  const substitutions: OutdoorVariantSubstitution[] = [];
  const result = new Map<string, ExerciseEquipmentSnapshot>();

  for (const item of current) {
    if (!isGymBoundEquipment(item.seedKey)) {
      result.set(item.equipmentId, item);
      continue;
    }

    const exactCandidates = REPLACEMENT_CANDIDATES[item.seedKey] ?? fallbackCandidates(item.seedKey);
    const baseReplacement = exactCandidates.map((key) => catalogueBySeed.get(key)).find(Boolean) ?? null;
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

export function outdoorVariantText(
  plan: OutdoorVariantPlan,
  locale: "de" | "en",
): string {
  if (!plan.canApply) return "";
  const replacements = plan.substitutions.map(({ original, replacement }) => {
    const from = locale === "de" ? original.nameDe : original.nameEn;
    const to = locale === "de" ? replacement?.nameDe : replacement?.nameEn;
    return `${from} → ${to}`;
  });
  const equipment = plan.equipment.map((item) => locale === "de" ? item.nameDe : item.nameEn).join(", ");
  return locale === "de"
    ? `Outdoor-Variante: ${replacements.join("; ")}. Verwende ${equipment || "kein Zusatzgerät"}. Behalte Bewegungsmuster, kontrollierten Bewegungsumfang und die bestehenden Sicherheits-/Qualitätskriterien bei; Last bzw. Bandspannung so wählen, dass die Standardtechnik stabil bleibt.`
    : `Outdoor variation: ${replacements.join("; ")}. Use ${equipment || "no additional equipment"}. Keep the same movement pattern, controlled range of motion and existing safety/quality criteria; choose load or band tension so standard technique remains stable.`;
}

function fallbackCandidates(seedKey: string): readonly string[] {
  const normalized = seedKey.toLowerCase();
  if (normalized.includes("cable")) return ["resistance-band"];
  if (normalized.includes("bench")) return ["box", "bodyweight"];
  if (normalized.includes("barbell") || normalized.includes("dumbbell")) return ["sandbag", "kettlebell", "resistance-band"];
  if (normalized.includes("machine")) return ["resistance-band", "bodyweight"];
  return [];
}
