export interface ExerciseProgressionLevels {
  readonly level1: string;
  readonly level2: string;
  readonly level3: string;
  readonly fallback?: string;
  readonly prerequisite?: string;
}

export interface ProgressionValidationIssue {
  readonly field: "level1" | "level2" | "level3" | "fallback" | "prerequisite";
  readonly message: string;
}

/** Keeps regressions and progressions explicit instead of hiding them in prose. */
export function validateProgressionLevels(levels: ExerciseProgressionLevels): readonly ProgressionValidationIssue[] {
  const issues: ProgressionValidationIssue[] = [];
  for (const field of ["level1", "level2", "level3"] as const) {
    if (!levels[field].trim()) issues.push({ field, message: `${field} must contain a trainer-readable instruction.` });
  }
  if (levels.level1.trim() === levels.level2.trim() && levels.level1.trim()) issues.push({ field: "level2", message: "Level 2 must differ from the regression." });
  if (levels.level2.trim() === levels.level3.trim() && levels.level2.trim()) issues.push({ field: "level3", message: "Level 3 must differ from the standard version." });
  if (!levels.fallback?.trim()) issues.push({ field: "fallback", message: "A fallback is required when equipment or the obstacle is unavailable." });
  if (!levels.prerequisite?.trim()) issues.push({ field: "prerequisite", message: "Advanced movements need an explicit prerequisite or a clear statement that none is required." });
  return issues;
}
