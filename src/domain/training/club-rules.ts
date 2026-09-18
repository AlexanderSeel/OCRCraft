import type { RiskLevel } from "./model";
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

  return {
    ...profile.rules,
    maximumRiskLevel,
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
