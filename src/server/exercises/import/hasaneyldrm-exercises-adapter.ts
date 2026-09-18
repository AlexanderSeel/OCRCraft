import { z } from "zod";
import { evaluateExternalContentLicense } from "./external-content-license-policy";

/** The public dataset is treated as untrusted input and media is metadata only. */
// The repository JSON uses relative paths (images/... and videos/...). Keep
// them as references and resolve them against the source repository later.
const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional());
export const hasaneyldrmExerciseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1),
  category: z.string().optional().default(""),
  body_part: z.string().optional().default(""),
  equipment: z.string().optional().default(""),
  instructions: z.record(z.string(), z.string()).optional().default({}),
  instruction_steps: z.record(z.string(), z.array(z.string())).optional().default({}),
  muscle_group: z.string().optional().default(""),
  secondary_muscles: z.union([z.string(), z.array(z.string())]).optional().default(""),
  target: z.string().optional().default(""),
  media_id: z.union([z.string(), z.number()]).optional(),
  image: optionalUrl,
  gif_url: optionalUrl,
  video: optionalUrl,
  video_url: optionalUrl,
  videoUrl: optionalUrl,
  attribution: z.string().optional(),
  source_provider: z.string().optional(),
  source_url: optionalUrl,
  license_label: z.string().optional(),
  license_verified: z.boolean().optional().default(false),
});

export type HasaneyldrmExercise = z.infer<typeof hasaneyldrmExerciseSchema>;

export interface ExerciseImportDraft {
  readonly sourceProvider: string;
  readonly sourceRecordId: string;
  readonly seedKey: string;
  readonly nameEn: string;
  readonly summaryEn: string;
  readonly executionStepsEn: readonly string[];
  readonly bodyRegionIds: readonly string[];
  readonly equipmentSeedKeys: readonly string[];
  readonly category: string;
  readonly translationStatus: "required";
  readonly reviewStatus: "draft";
  readonly sourceReference: string;
  readonly sourceMetadata: {
    readonly provider: string;
    readonly title: string;
    readonly sourceType: "dataset";
    readonly retrievedAt: string;
  };
  readonly mediaReference: {
    readonly image?: string;
    readonly gif?: string;
    readonly video?: string;
    readonly attribution?: string;
    readonly licenseLabel: string | null;
    readonly licenseVerified: boolean;
    readonly usage: "template_only";
  };
  readonly warnings: readonly string[];
}

const BODY_PART_MAP: Readonly<Record<string, string>> = {
  chest: "chest", back: "upper-back", shoulders: "shoulders", neck: "neck",
  "upper arms": "upper-arms", "lower arms": "forearms-grip", waist: "core",
  hips: "hips", "upper legs": "quadriceps", "lower legs": "calves", cardio: "full-body",
};
const EQUIPMENT_MAP: Readonly<Record<string, string>> = {
  bodyweight: "bodyweight", dumbbell: "dumbbell", barbell: "barbell", kettlebell: "kettlebell",
  band: "resistance-band", cable: "cable", machine: "machine", bench: "box", mat: "mat",
  rope: "rope", medicineball: "medicine-ball", "medicine ball": "medicine-ball",
};

function values(value: string | string[]): string[] {
  return (Array.isArray(value) ? value : value.split(/[,;|]/)).map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function slug(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function adaptHasaneyldrmExercise(input: unknown): ExerciseImportDraft {
  const record = hasaneyldrmExerciseSchema.parse(input);
  const bodyRegionIds = [...new Set([record.body_part, record.muscle_group, record.target]
    .flatMap(values).map((value) => BODY_PART_MAP[value] ?? (value.includes("glute") ? "glutes" : value.includes("quad") ? "quadriceps" : value.includes("hamstring") ? "hamstrings" : undefined)).filter((value): value is string => Boolean(value)))];
  const equipmentSeedKeys = [...new Set(values(record.equipment).map((value) => EQUIPMENT_MAP[value] ?? value))];
  const license = evaluateExternalContentLicense(record.license_label, record.license_verified);
  const sourceSteps = record.instruction_steps.en?.filter((step) => step.trim()) ?? [];
  const sourceSummary = record.instructions.en?.trim();
  const summary = license.licensedCopyAllowed && sourceSummary
    ? sourceSummary
    : `External catalogue reference for ${record.name}. Original source instructions were not copied because OCRCraft has no verified content license for this record.`;
  const steps = license.licensedCopyAllowed && sourceSteps.length >= 3
    ? sourceSteps
    : [
        "Trainer checks the setup, equipment and source reference before use.",
        "Use only an OCRCraft-reviewed, pain-free execution variant appropriate for the group.",
        "Stop if technique, spacing or control cannot be maintained.",
      ];
  const warnings = [
    ...(bodyRegionIds.length ? [] : ["No OCRCraft body region could be mapped"]),
    ...(equipmentSeedKeys.some((key) => !Object.values(EQUIPMENT_MAP).includes(key)) ? ["One or more equipment values need catalogue review"] : []),
    ...(!license.licensedCopyAllowed && (sourceSummary || sourceSteps.length > 0)
      ? ["External instruction text was not copied because no explicitly verified usable license/right label was supplied"]
      : []),
    ...(!license.licensedCopyAllowed && (record.image || record.gif_url || record.video || record.video_url || record.videoUrl)
      ? ["External media reference was suppressed because no explicitly verified usable license/right label was supplied"]
      : []),
    ...(license.licensedCopyAllowed && (record.image || record.gif_url || record.video || record.video_url || record.videoUrl)
      ? ["External media remains pending until source/license review is approved"]
      : []),
    "German translation and trainer review are required before publishing",
  ];
  const sourceProvider = record.source_provider ?? "hasaneyldrm/exercises-dataset";
  const licenseLabel = license.normalizedLicenseLabel;
  return {
    sourceProvider,
    sourceRecordId: String(record.id),
    seedKey: `imported-${slug(record.name)}-${String(record.id)}`,
    nameEn: record.name,
    summaryEn: summary,
    executionStepsEn: steps.length >= 3 ? steps : [summary, "Follow the controlled range of motion.", "Return to the start position and repeat."],
    bodyRegionIds,
    equipmentSeedKeys,
    category: record.category.trim(),
    translationStatus: "required",
    reviewStatus: "draft",
    sourceReference: record.source_url ?? `https://github.com/hasaneyldrm/exercises-dataset#${String(record.id)}`,
    sourceMetadata: {
      provider: sourceProvider,
      title: sourceProvider === "exercisedb.dev" ? "ExerciseDB Free V1" : "hasaneyldrm exercises dataset",
      sourceType: "dataset",
      retrievedAt: new Date().toISOString(),
    },
    mediaReference: {
      image: license.licensedCopyAllowed ? record.image : undefined,
      gif: license.licensedCopyAllowed ? record.gif_url : undefined,
      video: license.licensedCopyAllowed ? record.video ?? record.video_url ?? record.videoUrl : undefined,
      attribution: record.attribution,
      licenseLabel,
      licenseVerified: license.licensedCopyAllowed,
      usage: "template_only",
    },
    warnings,
  };
}

export function adaptHasaneyldrmExercises(input: unknown): ExerciseImportDraft[] {
  if (!Array.isArray(input)) throw new Error("Dataset import expects a JSON array");
  return input.map(adaptHasaneyldrmExercise);
}
