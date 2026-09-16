import type {
  RiskLevel,
  TrainingPhaseKind,
  TrainingSession,
} from "./model";

export type TrainingValidationSeverity = "warning" | "error";

export interface TrainingValidationIssue {
  readonly code:
    | "missing-phase"
    | "empty-main-part"
    | "duration-mismatch"
    | "risk-restricted";
  readonly severity: TrainingValidationSeverity;
  readonly message: string;
  readonly path?: string;
}

export interface ClubTrainingRules {
  readonly requiredPhases: readonly TrainingPhaseKind[];
  readonly durationToleranceMinutes: number;
  readonly maximumRiskLevel?: RiskLevel;
}

export const DEFAULT_CLUB_TRAINING_RULES: ClubTrainingRules = {
  requiredPhases: ["warmup", "main", "cooldown"],
  durationToleranceMinutes: 2,
};

const RISK_ORDER: Readonly<Record<RiskLevel, number>> = {
  low: 1,
  medium: 2,
  high: 3,
};

export function getPlannedDurationMinutes(session: TrainingSession): number {
  return session.phases.reduce(
    (sessionTotal, phase) =>
      sessionTotal +
      phase.items.reduce((phaseTotal, item) => phaseTotal + item.durationMinutes, 0),
    0,
  );
}

export function validateTrainingSession(
  session: TrainingSession,
  rules: ClubTrainingRules = DEFAULT_CLUB_TRAINING_RULES,
): readonly TrainingValidationIssue[] {
  const issues: TrainingValidationIssue[] = [];
  const availablePhases = new Set(session.phases.map((phase) => phase.kind));

  for (const requiredPhase of rules.requiredPhases) {
    if (!availablePhases.has(requiredPhase)) {
      issues.push({
        code: "missing-phase",
        severity: "error",
        message: `Pflichtphase fehlt: ${requiredPhase}.`,
        path: `phases.${requiredPhase}`,
      });
    }
  }

  const mainPhase = session.phases.find((phase) => phase.kind === "main");
  if (mainPhase && mainPhase.items.length === 0) {
    issues.push({
      code: "empty-main-part",
      severity: "error",
      message: "Der Hauptteil enthält noch keine Übung oder keinen Trainingsblock.",
      path: "phases.main.items",
    });
  }

  const plannedDuration = getPlannedDurationMinutes(session);
  if (
    Math.abs(plannedDuration - session.totalDurationMinutes) >
    rules.durationToleranceMinutes
  ) {
    issues.push({
      code: "duration-mismatch",
      severity: "warning",
      message: `Geplant sind ${plannedDuration} Min., die Einheit ist auf ${session.totalDurationMinutes} Min. angesetzt.`,
      path: "totalDurationMinutes",
    });
  }

  if (rules.maximumRiskLevel) {
    const maximumAllowedRisk = RISK_ORDER[rules.maximumRiskLevel];

    for (const phase of session.phases) {
      for (const item of phase.items) {
        if (RISK_ORDER[item.exercise.riskLevel] > maximumAllowedRisk) {
          issues.push({
            code: "risk-restricted",
            severity: "error",
            message: `${item.exercise.name} überschreitet die für diese Gruppe konfigurierte Risikostufe.`,
            path: `phases.${phase.id}.items.${item.id}`,
          });
        }
      }
    }
  }

  return issues;
}
