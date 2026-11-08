import type { Audience, TrainingLocation } from "./model";

export type PlanningMetadataIssue = "minimum-age" | "risk" | "audience" | "location" | "capacity" | "goals" | "movement-patterns";
export interface PlanningMetadata {
  readonly minAge: number | null;
  readonly riskLevel: string | null;
  readonly suitableForKids: boolean | null;
  readonly suitableForYouth: boolean | null;
  readonly suitableForAdults: boolean | null;
  readonly indoorSuitable: boolean | null;
  readonly outdoorSuitable: boolean | null;
  readonly stationCapacity: number | null;
  readonly trainingGoals: readonly string[];
  readonly movementPatterns: readonly string[];
}

/** Minimum data readiness, never a substitute for trainer/content approval. */
export function assessPlanningMetadata(metadata: PlanningMetadata, audience: Audience, location: TrainingLocation): readonly PlanningMetadataIssue[] {
  const issues: PlanningMetadataIssue[] = [];
  if (metadata.minAge == null || !Number.isInteger(metadata.minAge) || metadata.minAge < 4 || metadata.minAge > 99) issues.push("minimum-age");
  if (!["low", "medium", "high"].includes(metadata.riskLevel ?? "")) issues.push("risk");
  const suitability = { kids: metadata.suitableForKids, youth: metadata.suitableForYouth, adults: metadata.suitableForAdults };
  if (audience === "mixed"
    ? Object.values(suitability).some((value) => typeof value !== "boolean") || !Object.values(suitability).some((value) => value === true)
    : suitability[audience] !== true) issues.push("audience");
  if (location === "mixed"
    ? typeof metadata.indoorSuitable !== "boolean" || typeof metadata.outdoorSuitable !== "boolean" || (!metadata.indoorSuitable && !metadata.outdoorSuitable)
    : (location === "indoor" ? metadata.indoorSuitable : metadata.outdoorSuitable) !== true) issues.push("location");
  if (metadata.stationCapacity == null || !Number.isInteger(metadata.stationCapacity) || metadata.stationCapacity <= 0) issues.push("capacity");
  if (!metadata.trainingGoals.some((goal) => goal.trim().length > 0)) issues.push("goals");
  if (!metadata.movementPatterns.some((pattern) => pattern.trim().length > 0)) issues.push("movement-patterns");
  return issues;
}
