import {
  AUDIENCES,
  BODY_REGIONS,
  TRAINING_FORMATS,
  type Audience,
  type BodyRegion,
  type TrainingFormat,
} from "@/domain/training/model";
import type { DraftIntensity, TrainingDraft } from "@/domain/training/draft";

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
}

export interface ParsedAgeRange {
  readonly minAge?: number;
  readonly maxAge?: number;
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

export async function requestTrainingDraft(
  input: QuickCreateDraftClientInput,
): Promise<TrainingDraft> {
  const audience: Audience = isAudience(input.groupType) ? input.groupType : "mixed";
  const bodyRegions = input.bodyRegions.filter(isBodyRegion);
  const formats = input.formats.filter(isTrainingFormat);
  const intensity: DraftIntensity = isDraftIntensity(input.intensity) ? input.intensity : "balanced";
  const ages = parseAgeRange(input.ageRange);

  const response = await fetch("/api/training/draft", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      audience,
      participantCount: input.participantCount,
      durationMinutes: input.durationMinutes,
      goals: input.goals,
      bodyRegions,
      formats,
      intensity,
      preferredExerciseIds: input.preferredExerciseIds,
      ...ages,
      locale: "de",
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { readonly message?: string } | null;
    throw new Error(payload?.message ?? `Trainingsentwurf konnte nicht erstellt werden (${response.status}).`);
  }

  return (await response.json()) as TrainingDraft;
}
