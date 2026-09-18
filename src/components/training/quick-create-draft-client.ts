import { exerciseTypes, type ExerciseType } from "../../domain/exercise/classification";
import {
  AUDIENCES,
  BODY_REGIONS,
  MAIN_PART_EVERY_UNITS,
  MAIN_PART_PROGRAMMING_MODES,
  MAIN_PART_SCORE_MODES,
  PARTNER_WORK_MODES,
  TRAINING_FORMATS,
  TRAINING_LOCATIONS,
  type Audience,
  type BodyRegion,
  type MainPartEveryUnit,
  type MainPartProgramming,
  type MainPartProgrammingMode,
  type MainPartScoreMode,
  type PartnerWorkMode,
  type TrainingEquipmentAvailability,
  type TrainingFormat,
  type TrainingLocation,
  type TrainingOrganizationMode,
  type TrainingPhaseKind,
} from "../../domain/training/model";
import type { DraftIntensity, TrainingDraft } from "../../domain/training/draft";

export type QuickCreateBuilderMode = "local" | "ai";
export type DraftAlternativeMode = "easier" | "harder" | "equipment";

export interface QuickCreateDraftClientInput {
  readonly templateKey?: string;
  readonly competitionStyleKey?: string;
  readonly groupId?: string;
  readonly groupType: string;
  readonly ageRange: string;
  readonly participantCount: number;
  readonly durationMinutes: number;
  readonly goals: readonly string[];
  readonly bodyRegions: readonly string[];
  readonly avoidBodyRegions?: readonly string[];
  readonly exerciseTypes?: readonly string[];
  readonly formats: readonly string[];
  readonly location?: string;
  readonly intensity: string;
  readonly builderMode?: string;
  readonly warmupExerciseCount?: number;
  readonly mainExerciseCount?: number;
  readonly mainPartExerciseCounts?: readonly number[];
  readonly mainPartProgramming?: readonly MainPartProgramming[];
  readonly cooldownExerciseCount?: number;
  readonly mainPartCount?: number;
  readonly organizationMode?: string;
  readonly teamSize?: number;
  /** Explicit number of parallel groups in solo/rotation mode. */
  readonly groupSplitCount?: number;
  readonly sourceTrainingIds?: readonly string[];
  readonly preferredExerciseIds: readonly string[];
  readonly availableEquipment?: readonly TrainingEquipmentAvailability[];
  /** Undefined = do not constrain obstacles; [] = explicitly no obstacle stations available. */
  readonly availableObstacleExerciseIds?: readonly string[];
}

export interface ParsedAgeRange {
  readonly minAge?: number;
  readonly maxAge?: number;
}

export interface NormalizedTrainingDraftRequest {
  readonly templateKey?: string;
  readonly competitionStyleKey?: string;
  readonly groupId?: string;
  readonly audience: Audience;
  readonly participantCount: number;
  readonly durationMinutes: number;
  readonly goals: readonly string[];
  readonly bodyRegions: readonly BodyRegion[];
  readonly avoidBodyRegions: readonly BodyRegion[];
  readonly exerciseTypes: readonly ExerciseType[];
  readonly formats: readonly TrainingFormat[];
  readonly location: TrainingLocation;
  readonly intensity: DraftIntensity;
  readonly builderMode: QuickCreateBuilderMode;
  readonly warmupExerciseCount: number;
  readonly mainExerciseCount: number;
  readonly mainPartExerciseCounts: readonly number[];
  readonly mainPartProgramming: readonly MainPartProgramming[];
  readonly cooldownExerciseCount: number;
  readonly mainPartCount: number;
  readonly organizationMode: TrainingOrganizationMode;
  readonly teamSize?: number;
  readonly groupSplitCount?: number;
  readonly sourceTrainingIds: readonly string[];
  readonly preferredExerciseIds: readonly string[];
  readonly availableEquipment: readonly TrainingEquipmentAvailability[];
  readonly availableObstacleExerciseIds?: readonly string[];
  readonly minAge?: number;
  readonly maxAge?: number;
  readonly locale: "de";
}

export interface PersistedTrainingDraftResult {
  readonly id: string;
  readonly draft: TrainingDraft;
}

const AUDIENCE_SET = new Set<string>(AUDIENCES);
const BODY_REGION_SET = new Set<string>(BODY_REGIONS);
const EXERCISE_TYPE_SET = new Set<string>(exerciseTypes);
const FORMAT_SET = new Set<string>(TRAINING_FORMATS);
const LOCATION_SET = new Set<string>(TRAINING_LOCATIONS);
const INTENSITIES = new Set<string>(["technique", "balanced", "conditioning"]);
const BUILDER_MODES = new Set<string>(["local", "ai"]);
const ORGANIZATION_MODES = new Set<string>(["solo", "team"]);
const PROGRAMMING_MODE_SET = new Set<string>(MAIN_PART_PROGRAMMING_MODES);
const SCORE_MODE_SET = new Set<string>(MAIN_PART_SCORE_MODES);
const EVERY_UNIT_SET = new Set<string>(MAIN_PART_EVERY_UNITS);
const PARTNER_WORK_MODE_SET = new Set<string>(PARTNER_WORK_MODES);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isAudience(value: string): value is Audience { return AUDIENCE_SET.has(value); }
function isBodyRegion(value: string): value is BodyRegion { return BODY_REGION_SET.has(value); }
function isExerciseType(value: string): value is ExerciseType { return EXERCISE_TYPE_SET.has(value); }
function isTrainingFormat(value: string): value is TrainingFormat { return FORMAT_SET.has(value); }
function isTrainingLocation(value: string): value is TrainingLocation { return LOCATION_SET.has(value); }
function isDraftIntensity(value: string): value is DraftIntensity { return INTENSITIES.has(value); }
function isBuilderMode(value: string): value is QuickCreateBuilderMode { return BUILDER_MODES.has(value); }
function isOrganizationMode(value: string): value is TrainingOrganizationMode { return ORGANIZATION_MODES.has(value); }
function isProgrammingMode(value: string): value is MainPartProgrammingMode { return PROGRAMMING_MODE_SET.has(value); }
function isScoreMode(value: string | undefined): value is MainPartScoreMode { return value != null && SCORE_MODE_SET.has(value); }
function isEveryUnit(value: string | undefined): value is MainPartEveryUnit { return value != null && EVERY_UNIT_SET.has(value); }
function isPartnerWorkMode(value: string | undefined): value is PartnerWorkMode { return value != null && PARTNER_WORK_MODE_SET.has(value); }

function boundedInteger(value: number | undefined, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(value)) return fallback;
  return Math.max(min, Math.min(max, Number(value)));
}

function normalizeMainPartExerciseCounts(values: readonly number[] | undefined, mainPartCount: number, fallback: number): readonly number[] {
  if (values?.length === mainPartCount) return values.map((value) => boundedInteger(value, fallback, 1, 8));
  return Array.from({ length: mainPartCount }, () => fallback);
}

function normalizeProgramming(value: MainPartProgramming | undefined): MainPartProgramming {
  const mode: MainPartProgrammingMode = value?.mode && isProgrammingMode(value.mode) ? value.mode : "standard";
  const partnerMode = isPartnerWorkMode(value?.partnerMode) ? value.partnerMode : undefined;
  const partner: Pick<MainPartProgramming, "partnerMode" | "partnerSwitchSeconds"> = partnerMode
    ? {
        partnerMode,
        partnerSwitchSeconds: partnerMode === "alternating"
          ? boundedInteger(value?.partnerSwitchSeconds, 30, 5, 1800)
          : undefined,
      }
    : {};

  if (mode === "interval") return { mode, workSeconds: boundedInteger(value?.workSeconds, 40, 5, 3600), restSeconds: boundedInteger(value?.restSeconds, 20, 0, 1800), ...partner };
  if (mode === "rounds") return { mode, rounds: boundedInteger(value?.rounds, 3, 1, 50), scoreMode: isScoreMode(value?.scoreMode) ? value.scoreMode : "quality", roundRestSeconds: boundedInteger(value?.roundRestSeconds, 0, 0, 600), ...partner };
  if (mode === "ladder") {
    const ladderStart = boundedInteger(value?.ladderStart, 2, 1, 100);
    const ladderEnd = Math.max(ladderStart + 1, boundedInteger(value?.ladderEnd, 10, 1, 200));
    return { mode, ladderStart, ladderEnd, ladderStep: boundedInteger(value?.ladderStep, 2, 1, 50), ...partner };
  }
  if (mode === "reverse-ladder") {
    const ladderStart = boundedInteger(value?.ladderStart, 10, 2, 200);
    const ladderEnd = Math.min(ladderStart - 1, boundedInteger(value?.ladderEnd, 2, 1, 199));
    return { mode, ladderStart, ladderEnd, ladderStep: boundedInteger(value?.ladderStep, 2, 1, 50), ...partner };
  }
  if (mode === "pyramid") {
    const ladderStart = boundedInteger(value?.ladderStart, 2, 1, 100);
    const ladderStep = boundedInteger(value?.ladderStep, 2, 1, 50);
    const rawEnd = Math.max(ladderStart + ladderStep, boundedInteger(value?.ladderEnd, 10, 2, 200));
    const ladderEnd = ladderStart + Math.max(1, Math.round((rawEnd - ladderStart) / ladderStep)) * ladderStep;
    return { mode, ladderStart, ladderEnd, ladderStep, ...partner };
  }
  if (mode === "chipper") return { mode, chipperRepsPerExercise: boundedInteger(value?.chipperRepsPerExercise, 20, 1, 500), ...partner };
  if (mode === "every") return {
    mode,
    everyValue: boundedInteger(value?.everyValue, 500, 1, 10000),
    everyUnit: isEveryUnit(value?.everyUnit) ? value.everyUnit : "metres",
    everyWorkSeconds: boundedInteger(value?.everyWorkSeconds, 40, 5, 1800),
    everyRestSeconds: boundedInteger(value?.everyRestSeconds, 20, 0, 1800),
    ...partner,
  };
  return { mode, ...partner };
}

function normalizeMainPartProgramming(values: readonly MainPartProgramming[] | undefined, mainPartCount: number): readonly MainPartProgramming[] {
  return Array.from({ length: mainPartCount }, (_, index) => normalizeProgramming(values?.[index]));
}

export function parseAgeRange(value: string): ParsedAgeRange {
  const numbers = value.match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [];
  if (numbers.length === 0) return {};
  if (numbers.length >= 2) {
    const [first, second] = numbers;
    return { minAge: Math.min(first, second), maxAge: Math.max(first, second) };
  }
  const age = numbers[0];
  const normalized = value.trim().toLocaleLowerCase("de-DE");
  if (value.includes("+") || normalized.startsWith("ab ")) return { minAge: age };
  if (normalized.startsWith("bis ") || normalized.startsWith("max ")) return { maxAge: age };
  return { minAge: age, maxAge: age };
}

export function normalizeTrainingDraftRequest(input: QuickCreateDraftClientInput): NormalizedTrainingDraftRequest {
  const templateKey = input.templateKey?.trim();
  const normalizedTemplateKey = templateKey && /^[a-z0-9][a-z0-9-]{2,79}$/.test(templateKey) ? templateKey : undefined;
  const competitionStyleKey = input.competitionStyleKey?.trim();
  const normalizedCompetitionStyleKey = competitionStyleKey && /^[a-z0-9][a-z0-9-]{2,79}$/.test(competitionStyleKey)
    ? competitionStyleKey
    : undefined;
  const audience: Audience = isAudience(input.groupType) ? input.groupType : "mixed";
  const participantCount = boundedInteger(input.participantCount, 1, 1, 200);
  const bodyRegions = [...new Set(input.bodyRegions.filter(isBodyRegion))];
  const focusRegionSet = new Set(bodyRegions);
  const avoidBodyRegions = [...new Set((input.avoidBodyRegions ?? []).filter(isBodyRegion))].filter((region) => !focusRegionSet.has(region));
  const selectedExerciseTypes = [...new Set((input.exerciseTypes ?? []).filter(isExerciseType))];
  const formats = input.formats.filter(isTrainingFormat);
  const location: TrainingLocation = input.location && isTrainingLocation(input.location) ? input.location : "mixed";
  const intensity: DraftIntensity = isDraftIntensity(input.intensity) ? input.intensity : "balanced";
  const builderMode: QuickCreateBuilderMode = input.builderMode && isBuilderMode(input.builderMode) ? input.builderMode : "local";
  const organizationMode: TrainingOrganizationMode = input.organizationMode && isOrganizationMode(input.organizationMode) ? input.organizationMode : "solo";
  const warmupExerciseCount = boundedInteger(input.warmupExerciseCount, 2, 1, 6);
  const mainExerciseCount = boundedInteger(input.mainExerciseCount, 4, 1, 8);
  const cooldownExerciseCount = boundedInteger(input.cooldownExerciseCount, 2, 1, 6);
  const mainPartCount = boundedInteger(input.mainPartCount, 1, 1, 4);
  const mainPartExerciseCounts = normalizeMainPartExerciseCounts(input.mainPartExerciseCounts, mainPartCount, mainExerciseCount);
  const mainPartProgramming = normalizeMainPartProgramming(input.mainPartProgramming, mainPartCount);
  const teamSize = organizationMode === "team" ? boundedInteger(input.teamSize, Math.min(4, participantCount), 2, Math.min(20, Math.max(2, participantCount))) : undefined;
  const groupSplitCount = organizationMode === "solo" && input.groupSplitCount != null
    ? boundedInteger(input.groupSplitCount, 1, 1, Math.min(20, participantCount))
    : undefined;
  const sourceTrainingIds = [...new Set((input.sourceTrainingIds ?? []).filter((id) => UUID_PATTERN.test(id)))].slice(0, 6);
  const availableObstacleExerciseIds = input.availableObstacleExerciseIds == null
    ? undefined
    : [...new Set(input.availableObstacleExerciseIds.filter((id) => UUID_PATTERN.test(id)))].slice(0, 100);
  const ages = parseAgeRange(input.ageRange);
  const availableEquipment = new Map<string, number>();
  for (const item of input.availableEquipment ?? []) {
    if (!item.equipmentId.trim() || !Number.isInteger(item.quantityAvailable) || item.quantityAvailable < 0) continue;
    availableEquipment.set(item.equipmentId.trim(), item.quantityAvailable);
  }

  return {
    ...(normalizedTemplateKey ? { templateKey: normalizedTemplateKey } : {}),
    ...(normalizedCompetitionStyleKey ? { competitionStyleKey: normalizedCompetitionStyleKey } : {}),
    groupId: input.groupId && UUID_PATTERN.test(input.groupId) ? input.groupId : undefined,
    audience,
    participantCount,
    durationMinutes: boundedInteger(input.durationMinutes, 60, 30, 180),
    goals: input.goals,
    bodyRegions,
    avoidBodyRegions,
    exerciseTypes: selectedExerciseTypes,
    formats,
    location,
    intensity,
    builderMode,
    warmupExerciseCount,
    mainExerciseCount,
    mainPartExerciseCounts,
    mainPartProgramming,
    cooldownExerciseCount,
    mainPartCount,
    organizationMode,
    teamSize,
    groupSplitCount,
    sourceTrainingIds,
    preferredExerciseIds: input.preferredExerciseIds,
    availableEquipment: [...availableEquipment].map(([equipmentId, quantityAvailable]) => ({ equipmentId, quantityAvailable })),
    availableObstacleExerciseIds,
    ...ages,
    locale: "de",
  };
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { readonly message?: string } | null;
  return payload?.message ?? fallback;
}

export async function requestTrainingDraft(input: QuickCreateDraftClientInput): Promise<TrainingDraft> {
  const response = await fetch("/api/training/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(normalizeTrainingDraftRequest(input)) });
  if (!response.ok) throw new Error(await readErrorMessage(response, `Trainingsentwurf konnte nicht erstellt werden (${response.status}).`));
  return (await response.json()) as TrainingDraft;
}

export async function regenerateTrainingDraftPhase(input: QuickCreateDraftClientInput, currentDraft: TrainingDraft, phase: TrainingPhaseKind): Promise<TrainingDraft> {
  const response = await fetch("/api/training/draft/regenerate-phase", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request: normalizeTrainingDraftRequest(input), phase, current: toDraftSelection(currentDraft) }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, `Phase konnte nicht neu erstellt werden (${response.status}).`));
  return (await response.json()) as TrainingDraft;
}

export async function replaceTrainingDraftExercise(input: QuickCreateDraftClientInput, currentDraft: TrainingDraft, exerciseId: string, mode: DraftAlternativeMode): Promise<TrainingDraft> {
  const response = await fetch("/api/training/draft/replace-item", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request: normalizeTrainingDraftRequest(input), exerciseId, mode, current: toDraftSelection(currentDraft) }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, `Übungsalternative konnte nicht angewendet werden (${response.status}).`));
  return (await response.json()) as TrainingDraft;
}

export async function persistTrainingDraft(input: QuickCreateDraftClientInput, title?: string, reviewedDraft?: TrainingDraft): Promise<PersistedTrainingDraftResult> {
  const normalized = normalizeTrainingDraftRequest(input);
  const reviewed = normalized.builderMode === "ai" ? toReviewedAiSelection(reviewedDraft) : undefined;
  const response = await fetch("/api/training/draft/persist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ request: normalized, title: title?.trim() || undefined, groupId: input.groupId?.trim() || undefined, reviewed }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, `Trainingsentwurf konnte nicht gespeichert werden (${response.status}).`));
  return (await response.json()) as PersistedTrainingDraftResult;
}

function toDraftSelection(draft: TrainingDraft) {
  return {
    title: draft.session.title,
    phases: draft.session.phases.map((phase) => ({
      kind: phase.kind,
      items: phase.items.map((item) => ({
        exerciseId: item.exercise.id,
        durationMinutes: item.durationMinutes,
        format: item.format,
        instructions: item.instructions,
        levelLabel: item.levelLabel,
        mainPartIndex: item.mainPartIndex,
        mainPartTitle: item.mainPartTitle,
      })),
    })),
  };
}

function toReviewedAiSelection(draft?: TrainingDraft) {
  if (!draft || draft.source !== "ai") throw new Error("Der AI-Vorschlag muss vor dem Speichern erzeugt und geprüft werden.");
  return toDraftSelection(draft);
}