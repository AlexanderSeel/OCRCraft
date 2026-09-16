import type {
  RiskLevel,
  TrainingEquipmentAvailability,
  TrainingPhaseKind,
  TrainingSession,
} from "./model";

export type TrainingValidationSeverity = "warning" | "error";

export interface TrainingValidationIssue {
  readonly code:
    | "missing-phase"
    | "empty-main-part"
    | "duration-mismatch"
    | "risk-restricted"
    | "station-capacity"
    | "equipment-conflict"
    | "equipment-availability-unknown";
  readonly severity: TrainingValidationSeverity;
  readonly message: string;
  readonly path?: string;
  readonly participantCount?: number;
  readonly participantsAtExercise?: number;
  readonly stationCapacity?: number;
  readonly recommendedStationCount?: number;
  readonly equipmentId?: string;
  readonly requiredQuantity?: number;
  readonly availableQuantity?: number;
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
  availableEquipment: readonly TrainingEquipmentAvailability[] = [],
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

  for (const phase of session.phases) {
    if (phase.kind !== "main") continue;

    const circuitItems = phase.items.filter((item) => item.format === "circuit");
    const circuitStationCount = circuitItems.length;
    const groupSizePerCircuitStation = circuitStationCount > 0
      ? Math.ceil(session.group.participantCount / circuitStationCount)
      : 0;

    for (const item of phase.items) {
      const stationCapacity = item.exercise.stationCapacity;
      const participantsAtExercise = item.format === "circuit"
        ? groupSizePerCircuitStation
        : session.group.participantCount;
      if (
        stationCapacity == null ||
        !Number.isInteger(stationCapacity) ||
        stationCapacity < 1 ||
        participantsAtExercise <= stationCapacity
      ) {
        continue;
      }

      const recommendedStationCount = Math.ceil(participantsAtExercise / stationCapacity);
      issues.push({
        code: "station-capacity",
        severity: "warning",
        message: item.format === "circuit"
          ? `${item.exercise.name}: Bei ${circuitStationCount} Zirkelstationen sind bis zu ${participantsAtExercise} Teilnehmende gleichzeitig an dieser Übung. Eine Übungsstation fasst ${stationCapacity}; richte ${recommendedStationCount} parallele Varianten ein oder passe die Gruppeneinteilung an.`
          : `${item.exercise.name}: Eine Station fasst maximal ${stationCapacity} gleichzeitig Trainierende. Für ${session.group.participantCount} Teilnehmende brauchst du ${recommendedStationCount} parallele Stationen oder eine Gruppenrotation.`,
        path: `phases.${phase.id}.items.${item.id}`,
        participantCount: session.group.participantCount,
        participantsAtExercise,
        stationCapacity,
        recommendedStationCount,
      });
    }

    if (circuitStationCount === 0) continue;

    const stockByEquipment = new Map(
      availableEquipment.map((item) => [item.equipmentId, item.quantityAvailable]),
    );
    const equipmentDemandById = new Map<string, {
      name: string;
      stationDemands: number[];
      exerciseNames: Set<string>;
    }>();
    const unknownEquipmentById = new Map<string, {
      name: string;
      exerciseNames: Set<string>;
    }>();
    const baseGroupSize = Math.floor(session.group.participantCount / circuitStationCount);
    const remainder = session.group.participantCount % circuitStationCount;

    for (const [index, item] of circuitItems.entries()) {
      const groupSize = session.group.participantCount < circuitStationCount
        ? 1
        : baseGroupSize + (index < remainder ? 1 : 0);
      if (groupSize === 0) continue;

      const capacity = item.exercise.stationCapacity;
      const parallelCopies = capacity != null && Number.isInteger(capacity) && capacity > 0
        ? Math.ceil(groupSize / capacity)
        : 1;

      for (const requirement of item.exercise.equipmentRequirements ?? []) {
        if (!Number.isInteger(requirement.quantityPerStation) || requirement.quantityPerStation < 1) continue;

        if (!stockByEquipment.has(requirement.equipmentId)) {
          const unknown = unknownEquipmentById.get(requirement.equipmentId) ?? {
            name: requirement.name,
            exerciseNames: new Set<string>(),
          };
          unknown.exerciseNames.add(item.exercise.name);
          unknownEquipmentById.set(requirement.equipmentId, unknown);
          continue;
        }

        const demand = equipmentDemandById.get(requirement.equipmentId) ?? {
          name: requirement.name,
          stationDemands: [],
          exerciseNames: new Set<string>(),
        };
        demand.stationDemands.push(requirement.quantityPerStation * parallelCopies);
        demand.exerciseNames.add(item.exercise.name);
        equipmentDemandById.set(requirement.equipmentId, demand);
      }
    }

    const simultaneouslyActiveStations = Math.min(session.group.participantCount, circuitStationCount);
    for (const [equipmentId, demand] of equipmentDemandById) {
      const requiredQuantity = demand.stationDemands
        .sort((left, right) => right - left)
        .slice(0, simultaneouslyActiveStations)
        .reduce((sum, quantity) => sum + quantity, 0);
      const availableQuantity = stockByEquipment.get(equipmentId);
      if (availableQuantity == null || requiredQuantity <= availableQuantity) continue;

      issues.push({
        code: "equipment-conflict",
        severity: "warning",
        message: `Im gleichzeitigen Zirkelbetrieb benötigen ${[...demand.exerciseNames].join(" und ")} zusammen bis zu ${requiredQuantity} × ${demand.name}; für diese Einheit sind ${availableQuantity} vorhanden. Ergänze Material oder ändere die Stationsplanung.`,
        path: `phases.${phase.id}.equipment.${equipmentId}`,
        equipmentId,
        requiredQuantity,
        availableQuantity,
      });
    }

    for (const [equipmentId, unknown] of unknownEquipmentById) {
      issues.push({
        code: "equipment-availability-unknown",
        severity: "warning",
        message: `Der Bestand für ${unknown.name} wurde nicht angegeben, obwohl ${[...unknown.exerciseNames].join(" und ")} es im Zirkel benötigen. Ergänze die verfügbare Menge, damit OCRCraft Engpässe prüfen kann.`,
        path: `phases.${phase.id}.equipment.${equipmentId}`,
        equipmentId,
      });
    }
  }

  return issues;
}
