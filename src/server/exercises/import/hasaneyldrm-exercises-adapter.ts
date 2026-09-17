import { z } from "zod";

/** The public dataset is treated as untrusted input and media is metadata only. */
const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional());
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
  attribution: z.string().optional(),
});

export type HasaneyldrmExercise = z.infer<typeof hasaneyldrmExerciseSchema>;

export interface ExerciseImportDraft {
  readonly sourceProvider: "hasaneyldrm/exercises-dataset";
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
    readonly provider: "hasaneyldrm/exercises-dataset";
    readonly title: "hasaneyldrm exercises dataset";
    readonly sourceType: "dataset";
    readonly retrievedAt: string;
  };
  readonly mediaReference: {
    readonly image?: string;
    readonly gif?: string;
    readonly attribution?: string;
    readonly licenseLabel: "Gym-Visual-Lizenz";
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
  const steps = record.instruction_steps.en?.filter((step) => step.trim()) ?? [];
  const summary = record.instructions.en?.trim() || `${record.name} exercise imported from the external catalogue.`;
  const warnings = [
    ...(bodyRegionIds.length ? [] : ["No OCRCraft body region could be mapped"]),
    ...(equipmentSeedKeys.some((key) => !Object.values(EQUIPMENT_MAP).includes(key)) ? ["One or more equipment values need catalogue review"] : []),
    ...(record.image || record.gif_url ? ["Media is a template reference only and carries the Gym-Visual-Lizenz label"] : []),
    "German translation and trainer review are required before publishing",
  ];
  return {
    sourceProvider: "hasaneyldrm/exercises-dataset",
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
    sourceReference: `https://github.com/hasaneyldrm/exercises-dataset#${String(record.id)}`,
    sourceMetadata: {
      provider: "hasaneyldrm/exercises-dataset",
      title: "hasaneyldrm exercises dataset",
      sourceType: "dataset",
      retrievedAt: new Date().toISOString(),
    },
    mediaReference: {
      image: record.image,
      gif: record.gif_url,
      attribution: record.attribution,
      licenseLabel: "Gym-Visual-Lizenz",
      usage: "template_only",
    },
    warnings,
  };
}

export function adaptHasaneyldrmExercises(input: unknown): ExerciseImportDraft[] {
  if (!Array.isArray(input)) throw new Error("Dataset import expects a JSON array");
  return input.map(adaptHasaneyldrmExercise);
}
