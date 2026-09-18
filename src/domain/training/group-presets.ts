import type { ClubRuleProfileKey } from "./club-rules";
import type {
  Audience,
  RiskLevel,
  TrainingFormat,
  TrainingLocation,
} from "./model";

export const GROUP_PRESET_KEYS = [
  "kids",
  "youth",
  "beginner",
  "advanced",
  "competition",
  "running",
  "open",
] as const;

export type GroupPresetKey = (typeof GROUP_PRESET_KEYS)[number];

export interface GroupPresetDefinition {
  readonly key: GroupPresetKey;
  readonly labelDe: string;
  readonly descriptionDe: string;
  readonly defaultName: string;
  readonly audience: Audience;
  readonly minAge: number | null;
  readonly maxAge: number | null;
  readonly participantCount: number;
  readonly durationMinutes: number;
  readonly defaultLocation: TrainingLocation;
  readonly maximumRiskLevel: RiskLevel | null;
  readonly ruleProfile: ClubRuleProfileKey;
  readonly skillDistribution: {
    readonly beginnerPercent: number;
    readonly intermediatePercent: number;
    readonly advancedPercent: number;
  } | null;
  readonly preferredFormats: readonly TrainingFormat[];
}

export const GROUP_PRESETS: readonly GroupPresetDefinition[] = [
  {
    key: "kids",
    labelDe: "Kids",
    descriptionDe: "Spielerisch, übersichtlich und mit konservativem Sicherheitsprofil.",
    defaultName: "OCR Kids",
    audience: "kids",
    minAge: 7,
    maxAge: 11,
    participantCount: 12,
    durationMinutes: 60,
    defaultLocation: "mixed",
    maximumRiskLevel: "medium",
    ruleProfile: "kids-youth",
    skillDistribution: { beginnerPercent: 80, intermediatePercent: 20, advancedPercent: 0 },
    preferredFormats: ["circuit", "technique", "relay"],
  },
  {
    key: "youth",
    labelDe: "Youth",
    descriptionDe: "Technik, Athletik und skalierbare OCR-Herausforderungen für Jugendliche.",
    defaultName: "OCR Youth",
    audience: "youth",
    minAge: 12,
    maxAge: 17,
    participantCount: 14,
    durationMinutes: 75,
    defaultLocation: "mixed",
    maximumRiskLevel: "medium",
    ruleProfile: "kids-youth",
    skillDistribution: { beginnerPercent: 40, intermediatePercent: 50, advancedPercent: 10 },
    preferredFormats: ["circuit", "rig-run", "technique", "relay"],
  },
  {
    key: "beginner",
    labelDe: "Beginner",
    descriptionDe: "Einsteigergruppe mit Technikfokus und bewusst konservativer Belastungssteuerung.",
    defaultName: "OCR Beginner",
    audience: "adults",
    minAge: 16,
    maxAge: null,
    participantCount: 12,
    durationMinutes: 60,
    defaultLocation: "mixed",
    maximumRiskLevel: "medium",
    ruleProfile: "safety-first",
    skillDistribution: { beginnerPercent: 100, intermediatePercent: 0, advancedPercent: 0 },
    preferredFormats: ["circuit", "technique"],
  },
  {
    key: "advanced",
    labelDe: "Advanced",
    descriptionDe: "Fortgeschrittene Gruppe mit höherem Technik- und Belastungsspielraum.",
    defaultName: "OCR Advanced",
    audience: "adults",
    minAge: 16,
    maxAge: null,
    participantCount: 12,
    durationMinutes: 75,
    defaultLocation: "mixed",
    maximumRiskLevel: "high",
    ruleProfile: "standard",
    skillDistribution: { beginnerPercent: 0, intermediatePercent: 30, advancedPercent: 70 },
    preferredFormats: ["rig-run", "circuit", "amrap", "technique"],
  },
  {
    key: "competition",
    labelDe: "Competition",
    descriptionDe: "Wettkampforientierte Erwachsenengruppe mit voller OCR-Bandbreite.",
    defaultName: "OCR Competition",
    audience: "adults",
    minAge: 18,
    maxAge: null,
    participantCount: 12,
    durationMinutes: 90,
    defaultLocation: "mixed",
    maximumRiskLevel: "high",
    ruleProfile: "competition",
    skillDistribution: { beginnerPercent: 0, intermediatePercent: 20, advancedPercent: 80 },
    preferredFormats: ["rig-run", "run-exercise", "amrap", "circuit"],
  },
  {
    key: "running",
    labelDe: "Running",
    descriptionDe: "Laufbetonte OCR-Gruppe für Technik, Intervalle und Run-to-Obstacle-Übergänge.",
    defaultName: "OCR Running",
    audience: "adults",
    minAge: 16,
    maxAge: null,
    participantCount: 16,
    durationMinutes: 75,
    defaultLocation: "outdoor",
    maximumRiskLevel: "medium",
    ruleProfile: "standard",
    skillDistribution: { beginnerPercent: 30, intermediatePercent: 50, advancedPercent: 20 },
    preferredFormats: ["run-exercise", "rig-run", "relay"],
  },
  {
    key: "open",
    labelDe: "Open",
    descriptionDe: "Offene gemischte Gruppe ohne festgelegten Skill-Mix oder Formatvorgabe.",
    defaultName: "OCR Open",
    audience: "mixed",
    minAge: null,
    maxAge: null,
    participantCount: 16,
    durationMinutes: 75,
    defaultLocation: "mixed",
    maximumRiskLevel: null,
    ruleProfile: "standard",
    skillDistribution: null,
    preferredFormats: [],
  },
];

export function getGroupPreset(key: string | undefined): GroupPresetDefinition | undefined {
  return GROUP_PRESETS.find((preset) => preset.key === key);
}
