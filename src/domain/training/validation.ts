import type {
  RiskLevel,
  TrainingEquipmentAvailability,
  TrainingItem,
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
    | "exercise-restricted"
    | "age-restricted"
    | "impact-restricted"
    | "supervision-required"
    | "station-capacity"
    | "equipment-conflict"
    | "equipment-availability-unknown"
    | "setup-transition-time";
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
  readonly estimatedLogisticsMinutes?: number;
  readonly estimatedTotalMinutes?: number;
}

export interface ClubTrainingRules {
  readonly requiredPhases: readonly TrainingPhaseKind[];
  readonly durationToleranceMinutes: number;
  readonly maximumRiskLevel?: RiskLevel;
  readonly restrictedExerciseIds?: readonly string[];
  readonly safetyProfileName?: string;
  readonly requiredSupervision?: "normal" | "increased" | "direct";
  readonly safetyProfileAudience?: "kids" | "youth";
  readonly safetyMinimumAge?: number;
  readonly safetyMaximumAge?: number;
  readonly audienceSafety?: Partial<Record<"kids" | "youth" | "adults" | "mixed", {
    readonly maximumImpactLevel?: "low" | "moderate" | "high";
    readonly requireDirectSupervision?: boolean;
  }>>;
}

export const DEFAULT_CLUB_TRAINING_RULES: ClubTrainingRules = {
  requiredPhases: ["warmup", "main", "cooldown"],
  durationToleranceMinutes: 2,
  audienceSafety: {
    kids: { maximumImpactLevel: "moderate", requireDirectSupervision: true },
    youth: { maximumImpactLevel: "high", requireDirectSupervision: false },
  },
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

  let logisticsSeconds = 0;
  for (const phase of session.phases) {
    for (const [index, item] of phase.items.entries()) {
      const setup = item.exercise.setupSeconds;
      const transition = index < phase.items.length - 1 ? item.exercise.transitionSeconds : undefined;
      if (setup != null && Number.isInteger(setup) && setup > 0) logisticsSeconds += setup;
      if (transition != null && Number.isInteger(transition) && transition > 0) logisticsSeconds += transition;
    }
  }
  if (logisticsSeconds > 0) {
    const estimatedLogisticsMinutes = Math.ceil(logisticsSeconds / 60);
    const estimatedTotalMinutes = plannedDuration + estimatedLogisticsMinutes;
    if (estimatedTotalMinutes > session.totalDurationMinutes + rules.durationToleranceMinutes) {
      issues.push({
        code: "setup-transition-time",
        severity: "warning",
        message: `Übungszeiten plus geschätzter Aufbau und Übungswechsel dauern etwa ${estimatedTotalMinutes} Min.; angesetzt sind ${session.totalDurationMinutes} Min.`,
        path: "phases",
        estimatedLogisticsMinutes,
        estimatedTotalMinutes,
      });
    }
  }

  const restrictedExercises = new Set(rules.restrictedExerciseIds ?? []);
  if (restrictedExercises.size > 0) {
    for (const phase of session.phases) {
      for (const item of phase.items) {
        if (!restrictedExercises.has(item.exercise.id)) continue;
        issues.push({
          code: "exercise-restricted",
          severity: "error",
          message: `${item.exercise.name} ist durch das Schutzprofil ${rules.safetyProfileName ?? "dieser Gruppe"} explizit gesperrt.`,
          path: `phases.${phase.id}.items.${item.id}`,
        });
      }
    }
  }

  if (
    ((rules.safetyProfileAudience ?? session.group.audience) === "kids"
      || (rules.safetyProfileAudience ?? session.group.audience) === "youth")
    && rules.requiredSupervision
    && rules.requiredSupervision !== "normal"
  ) {
    const label = rules.requiredSupervision === "direct" ? "direkte Traineraufsicht" : "erhöhte Aufsicht";
    issues.push({
      code: "supervision-required",
      severity: "warning",
      message: `${rules.safetyProfileName ?? "Das Schutzprofil"} verlangt für diese Gruppe ${label}. Dies muss organisatorisch sichergestellt werden.`,
      path: "group",
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

  const effectiveAudience = rules.safetyProfileAudience ?? session.group.audience;
  const effectiveMinimumAge = rules.safetyMinimumAge ?? session.group.minAge;
  const audienceRule = rules.audienceSafety?.[effectiveAudience];
  if (audienceRule) {
    const impactOrder = { low: 1, moderate: 2, high: 3 } as const;
    for (const phase of session.phases) for (const item of phase.items) {
      const exercise = item.exercise;
      const path = `phases.${phase.id}.items.${item.id}`;
      if (exercise.minimumAge != null && effectiveMinimumAge != null && effectiveMinimumAge < exercise.minimumAge) {
        issues.push({ code: "age-restricted", severity: "error", message: `${exercise.name} ist erst ab ${exercise.minimumAge} Jahren vorgesehen.`, path });
      }
      if (exercise.suitableForAudience === false) {
        issues.push({ code: "age-restricted", severity: "error", message: `${exercise.name} ist für die Zielgruppe ${effectiveAudience} nicht freigegeben.`, path });
      }
      if (exercise.impactLevel && audienceRule.maximumImpactLevel && impactOrder[exercise.impactLevel] > impactOrder[audienceRule.maximumImpactLevel]) {
        issues.push({ code: "impact-restricted", severity: "error", message: `${exercise.name} überschreitet die erlaubte Aufprallstufe für ${effectiveAudience}.`, path });
      }
      if (audienceRule.requireDirectSupervision && exercise.supervision === "direct") {
        issues.push({ code: "supervision-required", severity: "warning", message: `${exercise.name} benötigt direkte Traineraufsicht.`, path });
      }
    }
  }

  for (const phase of session.phases) {
    if (phase.kind !== "main") continue;
    const blocks = groupMainPartItems(phase.items);
    for (const [mainPartIndex, items] of blocks) {
      validateMainPartLogistics(
        issues,
        session,
        phase.id,
        mainPartIndex,
        items,
        availableEquipment,
      );
    }
  }

  return issues;
}

function groupMainPartItems(items: readonly TrainingItem[]): ReadonlyMap<number, readonly TrainingItem[]> {
  const groups = new Map<number, TrainingItem[]>();
  for (const item of items) {
    const index = Number.isInteger(item.mainPartIndex) && (item.mainPartIndex ?? 0) > 0
      ? item.mainPartIndex as number
      : 1;
    const group = groups.get(index) ?? [];
    group.push(item);
    groups.set(index, group);
  }
  return groups;
}

function validateMainPartLogistics(
  issues: TrainingValidationIssue[],
  session: TrainingSession,
  phaseId: string,
  mainPartIndex: number,
  items: readonly TrainingItem[],
  availableEquipment: readonly TrainingEquipmentAvailability[],
): void {
  const circuitItems = items.filter((item) => item.format === "circuit");
  const circuitStationCount = circuitItems.length;
  const teamMode = session.group.organizationMode === "team" && (session.group.teamSize ?? 0) >= 2;
  const teamSize = teamMode
    ? Math.min(session.group.participantCount, session.group.teamSize ?? session.group.participantCount)
    : null;
  const teamCount = teamSize != null ? Math.ceil(session.group.participantCount / teamSize) : null;
  const declaredGroupCount = !teamMode && Number.isInteger(session.group.groupSplitCount) && (session.group.groupSplitCount ?? 0) > 0
    ? Math.min(session.group.participantCount, session.group.groupSplitCount as number)
    : null;
  const rotationGroupSize = declaredGroupCount != null
    ? Math.ceil(session.group.participantCount / declaredGroupCount)
    : null;
  const groupSizePerCircuitStation = circuitStationCount > 0
    ? teamSize ?? rotationGroupSize ?? Math.ceil(session.group.participantCount / circuitStationCount)
    : 0;
  const pathPrefix = `phases.${phaseId}.mainPart.${mainPartIndex}`;

  for (const item of items) {
    const stationCapacity = item.exercise.stationCapacity;
    const participantsAtExercise = item.format === "circuit"
      ? groupSizePerCircuitStation
      : teamSize ?? rotationGroupSize ?? session.group.participantCount;
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
        ? `${item.exercise.name}: Im Hauptteil ${mainPartIndex} arbeiten bis zu ${participantsAtExercise} Personen gleichzeitig an dieser Übung${declaredGroupCount != null ? ` (${declaredGroupCount} Rotationsgruppen)` : ""}. Eine Station fasst ${stationCapacity}; richte ${recommendedStationCount} parallele Varianten ein oder passe Gruppen-/Stationsgröße an.`
        : teamMode
          ? `${item.exercise.name}: Ein Team umfasst bis zu ${participantsAtExercise} Personen, die Station fasst ${stationCapacity}. Plane ${recommendedStationCount} parallele Ausführungen innerhalb des Teams oder verkleinere die Teamgröße.`
          : declaredGroupCount != null
            ? `${item.exercise.name}: Bei ${declaredGroupCount} Rotationsgruppen umfasst die größte Gruppe bis zu ${participantsAtExercise} Personen, die Station fasst ${stationCapacity}. Plane ${recommendedStationCount} parallele Ausführungen oder erhöhe die Gruppenzahl.`
            : `${item.exercise.name}: Eine Station fasst maximal ${stationCapacity} gleichzeitig Trainierende. Für ${session.group.participantCount} Teilnehmende brauchst du ${recommendedStationCount} parallele Stationen oder eine Gruppenrotation.`,
      path: `${pathPrefix}.items.${item.id}`,
      participantCount: session.group.participantCount,
      participantsAtExercise,
      stationCapacity,
      recommendedStationCount,
    });
  }

  if (circuitStationCount === 0) return;

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

  const baseGroupSize = teamMode
    ? teamSize ?? 1
    : rotationGroupSize ?? Math.floor(session.group.participantCount / circuitStationCount);
  const remainder = teamMode || rotationGroupSize != null
    ? 0
    : session.group.participantCount % circuitStationCount;

  for (const [index, item] of circuitItems.entries()) {
    const groupSize = teamMode || rotationGroupSize != null
      ? baseGroupSize
      : session.group.participantCount < circuitStationCount
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

  const simultaneouslyActiveStations = teamMode
    ? Math.min(teamCount ?? 1, circuitStationCount)
    : declaredGroupCount != null
      ? Math.min(declaredGroupCount, circuitStationCount)
      : Math.min(session.group.participantCount, circuitStationCount);

  for (const [equipmentId, demand] of equipmentDemandById) {
    const requiredQuantity = [...demand.stationDemands]
      .sort((left, right) => right - left)
      .slice(0, simultaneouslyActiveStations)
      .reduce((sum, quantity) => sum + quantity, 0);
    const availableQuantity = stockByEquipment.get(equipmentId);
    if (availableQuantity == null || requiredQuantity <= availableQuantity) continue;

    issues.push({
      code: "equipment-conflict",
      severity: "warning",
      message: `Im Hauptteil ${mainPartIndex} benötigen ${[...demand.exerciseNames].join(" und ")} gleichzeitig bis zu ${requiredQuantity} × ${demand.name}; verfügbar sind ${availableQuantity}.${declaredGroupCount != null ? ` Berechnet für ${declaredGroupCount} Rotationsgruppen.` : ""} Ergänze Material oder ändere Team-/Stationsplanung.`,
      path: `${pathPrefix}.equipment.${equipmentId}`,
      equipmentId,
      requiredQuantity,
      availableQuantity,
    });
  }

  for (const [equipmentId, unknown] of unknownEquipmentById) {
    issues.push({
      code: "equipment-availability-unknown",
      severity: "warning",
      message: `Der Bestand für ${unknown.name} wurde nicht angegeben, obwohl ${[...unknown.exerciseNames].join(" und ")} es im Hauptteil ${mainPartIndex} benötigen. Ergänze die verfügbare Menge, damit OCRCraft Engpässe prüfen kann.`,
      path: `${pathPrefix}.equipment.${equipmentId}`,
      equipmentId,
    });
  }
}