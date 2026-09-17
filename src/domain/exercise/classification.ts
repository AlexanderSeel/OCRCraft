export const exerciseTypes = [
  "drill",
  "strength",
  "endurance",
  "mobility",
  "skill",
  "obstacle",
  "game",
  "recovery",
] as const;
export type ExerciseType = (typeof exerciseTypes)[number];

export const exerciseDifficulties = ["beginner", "intermediate", "advanced"] as const;
export type ExerciseDifficulty = (typeof exerciseDifficulties)[number];

export const exerciseImpactLevels = ["low", "moderate", "high"] as const;
export type ExerciseImpactLevel = (typeof exerciseImpactLevels)[number];

export const exerciseCoordinationComplexities = ["simple", "moderate", "complex"] as const;
export type ExerciseCoordinationComplexity = (typeof exerciseCoordinationComplexities)[number];

export const exerciseLateralities = ["bilateral", "unilateral", "alternating", "locomotion"] as const;
export type ExerciseLaterality = (typeof exerciseLateralities)[number];

export const exerciseMovementPlanes = ["sagittal", "frontal", "transverse", "multiplanar"] as const;
export type ExerciseMovementPlane = (typeof exerciseMovementPlanes)[number];

export const exerciseTrainingGoals = [
  "strength",
  "strength_endurance",
  "endurance",
  "speed",
  "coordination",
  "balance",
  "mobility",
  "grip",
  "ocr_technique",
  "recovery",
  "teamwork",
] as const;
export type ExerciseTrainingGoal = (typeof exerciseTrainingGoals)[number];

export const exerciseTypeLabels: Readonly<Record<ExerciseType, string>> = {
  drill: "Drill",
  strength: "Kraft",
  endurance: "Ausdauer",
  mobility: "Mobilität",
  skill: "Technik / Skill",
  obstacle: "Hindernis",
  game: "Spiel",
  recovery: "Regeneration",
};

export const exerciseDifficultyLabels: Readonly<Record<ExerciseDifficulty, string>> = {
  beginner: "Einsteiger",
  intermediate: "Mittel",
  advanced: "Fortgeschritten",
};

export const exerciseImpactLevelLabels: Readonly<Record<ExerciseImpactLevel, string>> = {
  low: "Niedrig",
  moderate: "Mittel",
  high: "Hoch",
};

export const exerciseCoordinationComplexityLabels: Readonly<Record<ExerciseCoordinationComplexity, string>> = {
  simple: "Einfach",
  moderate: "Mittel",
  complex: "Komplex",
};

export const exerciseLateralityLabels: Readonly<Record<ExerciseLaterality, string>> = {
  bilateral: "Beidseitig",
  unilateral: "Einseitig",
  alternating: "Wechselnd",
  locomotion: "Fortbewegung",
};

export const exerciseMovementPlaneLabels: Readonly<Record<ExerciseMovementPlane, string>> = {
  sagittal: "Sagittal",
  frontal: "Frontal",
  transverse: "Transversal",
  multiplanar: "Mehrdimensional",
};

export const exerciseTrainingGoalLabels: Readonly<Record<ExerciseTrainingGoal, { readonly de: string; readonly en: string }>> = {
  strength: { de: "Kraft", en: "Strength" },
  strength_endurance: { de: "Kraftausdauer", en: "Strength Endurance" },
  endurance: { de: "Ausdauer", en: "Endurance" },
  speed: { de: "Schnelligkeit", en: "Speed" },
  coordination: { de: "Koordination", en: "Coordination" },
  balance: { de: "Balance", en: "Balance" },
  mobility: { de: "Mobilität", en: "Mobility" },
  grip: { de: "Griffkraft", en: "Grip" },
  ocr_technique: { de: "OCR-Technik", en: "OCR Technique" },
  recovery: { de: "Regeneration", en: "Recovery" },
  teamwork: { de: "Teamwork", en: "Teamwork" },
};
