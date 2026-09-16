import {
  AUDIENCES,
  BODY_REGIONS,
  TRAINING_FORMATS,
  type Audience,
  type BodyRegion,
  type TrainingEquipmentAvailability,
  type TrainingFormat,
} from "../../domain/training/model";
import type { DraftIntensity, TrainingDraft } from "../../domain/training/draft";

export interface QuickCreateDraftClientInput {
  readonly groupType: string;
  readonly ageRange: string;
  readonly participantCount: number;
  readonly durationMinutes: number;
  readonly goals: readonly string[];
  readonly bodyRegions: readonly string[];
  readonly formats: readonly string[];
  readonly intensity: string;
  readonly preferredExerciseIds: readonly string[];
  readonly availableEquipment?: readonly TrainingEquipmentAvailability[];
}

export interface ParsedAgeRange {
  readonly minAge?: number;
  readonly maxAge?: number;
}

export interface NormalizedTrainingDraftRequest {
  readonly audience: Audience;
  readonly participantCount: number;
  readonly durationMinutes: number;
  readonly goals: readonly string[];
  readonly bodyRegions: readonly BodyRegion[];
  readonly formats: readonly TrainingFormat[];
  readonly intensity: DraftIntensity;
  readonly preferredExerciseIds: readonly string[];
  readonly availableEquipment: readonly TrainingEquipmentAvailability[];
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
const FORMAT_SET = new Set<string>(TRAINING_FORMATS);
const INTENSITIES = new Set<string>(["technique", "balanced", "conditioning"]);

function isAudience(value: string): value is Audience {
  return AUDIENCE_SET.has(value);
}

function isBodyRegion(value: string): value is BodyRegion {
  return BODY_REGION_SET.has(value);
}

function isTrainingFormat(value: string): value is TrainingFormat {
  return FORMAT_SET.has(value);
}

function isDraftIntensity(value: string): value is DraftIntensity {
  return INTENSITIES.has(value);
}

export function parseAgeRange(value: string): ParsedAgeRange {
  const numbers = value.match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [];
  if (numbers.length === 0) return {};

  if (numbers.length >= 2) {
    const [first, second] = numbers;
    return {
      minAge: Math.min(first, second),
      maxAge: Math.max(first, second),
    };
  }

  const age = numbers[0];
  return value.includes("+") ? { minAge: age } : { minAge: age, maxAge: age };
}

export function normalizeTrainingDraftRequest(
  input: QuickCreateDraftClientInput,
): NormalizedTrainingDraftRequest {
  const audience: Audience = isAudience(input.groupType) ? input.groupType : "mixed";
  const bodyRegions = input.bodyRegions.filter(isBodyRegion);
  const formats = input.formats.filter(isTrainingFormat);
  const intensity: DraftIntensity = isDraftIntensity(input.intensity) ? input.intensity : "balanced";
  const ages = parseAgeRange(input.ageRange);
  const availableEquipment = new Map<string, number>();
  for (const item of input.availableEquipment ?? []) {
    if (!item.equipmentId.trim() || !Number.isInteger(item.quantityAvailable) || item.quantityAvailable < 0) continue;
    availableEquipment.set(item.equipmentId.trim(), item.quantityAvailable);
  }

  return {
    audience,
    participantCount: input.participantCount,
    durationMinutes: input.durationMinutes,
    goals: input.goals,
    bodyRegions,
    formats,
    intensity,
    preferredExerciseIds: input.preferredExerciseIds,
    availableEquipment: [...availableEquipment].map(([equipmentId, quantityAvailable]) => ({
      equipmentId,
      quantityAvailable,
    })),
    ...ages,
    locale: "de",
  };
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { readonly message?: string } | null;
  return payload?.message ?? fallback;
}

export async function requestTrainingDraft(
  input: QuickCreateDraftClientInput,
): Promise<TrainingDraft> {
  const response = await fetch("/api/training/draft", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(normalizeTrainingDraftRequest(input)),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        `Trainingsentwurf konnte nicht erstellt werden (${response.status}).`,
      ),
    );
  }

  return (await response.json()) as TrainingDraft;
}

export async function persistTrainingDraft(
  input: QuickCreateDraftClientInput,
  title?: string,
): Promise<PersistedTrainingDraftResult> {
  const response = await fetch("/api/training/draft/persist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      request: normalizeTrainingDraftRequest(input),
      title: title?.trim() || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        `Trainingsentwurf konnte nicht gespeichert werden (${response.status}).`,
      ),
    );
  }

  return (await response.json()) as PersistedTrainingDraftResult;
}
