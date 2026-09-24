export type EquipmentPortability = "portable" | "fixed" | "unclassified";

export const portableEquipmentSeedKeys = [
  "cones",
  "mini-hurdles",
  "agility-ladder",
  "box",
  "rings",
  "rope",
  "kettlebell",
  "sandbag",
  "atlas-ball",
  "bucket",
  "sled",
  "tire",
  "medicine-ball",
  "spear-trainer",
  "resistance-band",
  "mat",
] as const;

export const fixedEquipmentSeedKeys = [
  "pullup-bar",
  "monkey-bars",
  "balance-beam",
  "wall",
  "cargo-net",
] as const;

const portableEquipment = new Set<string>(portableEquipmentSeedKeys);
const fixedEquipment = new Set<string>(fixedEquipmentSeedKeys);

export function classifyEquipmentPortability(seedKey: string | null | undefined): EquipmentPortability {
  const normalized = seedKey?.trim();
  if (!normalized) return "unclassified";
  if (portableEquipment.has(normalized)) return "portable";
  if (fixedEquipment.has(normalized)) return "fixed";
  return "unclassified";
}
