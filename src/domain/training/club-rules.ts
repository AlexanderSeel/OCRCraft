import type { RiskLevel } from "./model";
import type { TrainerQualificationLevel } from "./trainer-qualification";
import {
  DEFAULT_CLUB_TRAINING_RULES,
  type ClubTrainingRules,
} from "./validation";

export const CLUB_RULE_PROFILE_KEYS = [
  "standard",
  "safety-first",
  "kids-youth",
  "competition",
] as const;

export type ClubRuleProfileKey = (typeof CLUB_RULE_PROFILE_KEYS)[number];

export interface YouthSafetyRuleOverlay {
  readonly name: string;
  readonly audience: "kids" | "youth";
  readonly maximumRiskLevel: RiskLevel;
  readonly maximumImpactLevel: "low" | "moderate" | "high";
  readonly supervisionRequirement: "normal" | "increased" | "direct";
  readonly restrictedExerciseIds: readonly string[];
  readonly minimumParticipantAge: number;
  readonly maximumParticipantAge: number;
  readonly minimumTrainerQualification: TrainerQualificationLevel;
}

export interface ClubRuleProfileDefinition {
  readonly key: ClubRuleProfileKey;
  readonly labelDe: string;
  readonly descriptionDe: string;
  readonly rules: ClubTrainingRules;
}

export const CLUB_RULE_PROFILES: readonly ClubRuleProfileDefinition[] = [
  {
    key: "standard",
    labelDe: "Standard",
    descriptionDe: "OCRCraft-Standardregeln mit zielgruppenabhängiger Sicherheitsprüfung.",
    rules: DEFAULT_CLUB_TRAINING_RULES,
  },
  {
    key: "safety-first",
    labelDe: "Safety First",
    descriptionDe: "Begrenzt Risiko und Impact stärker und fordert engere Aufsicht für Kids und Jugend.",
    rules: {
      ...DEFAULT_CLUB_TRAINING_RULES,
      maximumRiskLevel: "medium",
      audienceSafety: {
        ...DEFAULT_CLUB_TRAINING_RULES.audienceSafety,
        kids: { maximumImpactLevel: "moderate", requireDirectSupervision: true },
        youth: { maximumImpactLevel: "moderate", requireDirectSupervision: true },
        adults: { maximumImpactLevel: "moderate", requireDirectSupervision: false },
        mixed: { maximumImpactLevel: "moderate", requireDirectSupervision: true },
      },
    },
  },
  {
    key: "kids-youth",
    labelDe: "Kids & Youth",
    descriptionDe: "Konservatives Gruppenprofil für Kinder/Jugend mit maximal mittlerem Risiko und direkter Aufsicht.",
    rules: {
      ...DEFAULT_CLUB_TRAINING_RULES,
      maximumRiskLevel: "medium",
      audienceSafety: {
        ...DEFAULT_CLUB_TRAINING_RULES.audienceSafety,
        kids: { maximumImpactLevel: "moderate", requireDirectSupervision: true },
        youth: { maximumImpactLevel: "moderate", requireDirectSupervision: true },
        mixed: { maximumImpactLevel: "moderate", requireDirectSupervision: true },
      },
    },
  },
  {
    key: "competition",
    labelDe: "Competition",
    descriptionDe: "Erlaubt das volle Risikospektrum für Erwachsene; Kids-/Youth-Sicherheitsgrenzen bleiben erhalten.",
    rules: {
      ...DEFAULT_CLUB_TRAINING_RULES,
      maximumRiskLevel: "high",
    },
  },
];

const RISK_ORDER: Readonly<Record<RiskLevel, number>> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function getClubRuleProfile(key: ClubRuleProfileKey): ClubRuleProfileDefinition {
  return CLUB_RULE_PROFILES.find((profile) => profile.key === key) ?? CLUB_RULE_PROFILES[0]!;
}

export function combineClubTrainingRules(
  profileKey: ClubRuleProfileKey,
  groupMaximumRiskLevel: RiskLevel | null,
  youthSafety?: YouthSafetyRuleOverlay | null,
): ClubTrainingRules {
  const profile = getClubRuleProfile(profileKey);
  const profileMaximum = profile.rules.maximumRiskLevel;
  const maximumRiskLevel = groupMaximumRiskLevel == null
    ? profileMaximum
    : profileMaximum == null
      ? groupMaximumRiskLevel
      : RISK_ORDER[groupMaximumRiskLevel] <= RISK_ORDER[profileMaximum]
        ? groupMaximumRiskLevel
        : profileMaximum;

  const safetyMaximumRisk = youthSafety?.maximumRiskLevel;
  const effectiveMaximumRisk = safetyMaximumRisk == null
    ? maximumRiskLevel
    : maximumRiskLevel == null
      ? safetyMaximumRisk
      : RISK_ORDER[safetyMaximumRisk] <= RISK_ORDER[maximumRiskLevel]
        ? safetyMaximumRisk
        : maximumRiskLevel;

  const audienceSafety = { ...profile.rules.audienceSafety };
  if (youthSafety) {
    const current = audienceSafety[youthSafety.audience] ?? {};
    const impactOrder = { low: 1, moderate: 2, high: 3 } as const;
    const currentMaximum = current.maximumImpactLevel;
    const maximumImpactLevel = currentMaximum == null
      || impactOrder[youthSafety.maximumImpactLevel] <= impactOrder[currentMaximum]
      ? youthSafety.maximumImpactLevel
      : currentMaximum;
    audienceSafety[youthSafety.audience] = {
      ...current,
      maximumImpactLevel,
      requireDirectSupervision:
        current.requireDirectSupervision === true || youthSafety.supervisionRequirement === "direct",
    };
  }

  return {
    ...profile.rules,
    maximumRiskLevel: effectiveMaximumRisk,
    audienceSafety,
    restrictedExerciseIds: youthSafety?.restrictedExerciseIds ?? [],
    safetyProfileName: youthSafety?.name,
    requiredSupervision: youthSafety?.supervisionRequirement,
    safetyProfileAudience: youthSafety?.audience,
    safetyMinimumAge: youthSafety?.minimumParticipantAge,
    safetyMaximumAge: youthSafety?.maximumParticipantAge,
    requiredTrainerQualification: youthSafety?.minimumTrainerQualification,
  };
}

export function riskAllowedByClubRules(
  riskLevel: RiskLevel,
  rules: ClubTrainingRules,
): boolean {
  return rules.maximumRiskLevel == null
    || RISK_ORDER[riskLevel] <= RISK_ORDER[rules.maximumRiskLevel];
}

export function impactAllowedByClubRules(
  audience: "kids" | "youth" | "adults" | "mixed",
  impactLevel: "low" | "moderate" | "high" | undefined,
  rules: ClubTrainingRules,
): boolean {
  const maximum = rules.audienceSafety?.[audience]?.maximumImpactLevel;
  if (!maximum || !impactLevel) return true;
  const order = { low: 1, moderate: 2, high: 3 } as const;
  return order[impactLevel] <= order[maximum];
}
