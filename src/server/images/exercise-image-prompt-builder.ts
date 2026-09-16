import type { ExerciseImageGenerationContext, LocalizedExerciseImageGuidance } from "./exercise-image-types";
import { ocrcraftExerciseIllustrationV1 } from "./ocrcraft-exercise-illustration-v1";

function section(label: string, content: string): string {
  return `${label}: ${content.trim() || "Not specified in the exercise catalog."}`;
}

function renderGuidance(locale: "de" | "en", guidance: LocalizedExerciseImageGuidance): string {
  const language = locale === "de" ? "German" : "English";
  return [
    `${language} exercise reference`,
    section("Name", guidance.name),
    section("Summary", guidance.summary),
    section("Purpose", guidance.purpose),
    section("Setup", guidance.setup),
    section("Starting position", guidance.startPosition),
    section("Ordered execution", guidance.executionSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")),
    section("Finish and reset", guidance.finishReset),
    section("Breathing cue", guidance.breathingCue),
    section("Tempo cue", guidance.tempoCue),
    section("Coaching cues", guidance.coachingCues.join("; ")),
    section("Quality criteria", guidance.qualityCriteria),
    section("Common mistakes and corrections", guidance.commonMistakes.map(({ mistake, correction }) => `${mistake} → ${correction}`).join("; ")),
    section("Safety notes", guidance.safetyNotes),
    section("Prerequisites", guidance.prerequisites),
    section("Fallback", guidance.fallbackExercise),
    section("Additional structured coaching", guidance.specializedGuidance.join("; ")),
  ].join("\n");
}

export function buildExerciseImagePrompt(context: ExerciseImageGenerationContext): string {
  const { localized } = context;
  const equipment = context.equipment.map((item) => `${item.nameDe} / ${item.nameEn} (quantity ${item.quantity})`).join(", ");
  const bodyRegions = context.bodyRegions.map((region) => `${region.emphasis}: ${region.labelDe} / ${region.labelEn}`).join(", ");
  const movementPatterns = context.movementPatterns.map((pattern) => `${pattern.labelDe} / ${pattern.labelEn}`).join(", ");

  return [
    ocrcraftExerciseIllustrationV1.prompt,
    "Illustrate the exact catalog exercise described below. This catalog content is the source of truth for movement mechanics; do not invent a different exercise or add unlisted equipment.",
    `Exercise ID: ${context.exerciseId}`,
    `Category and type: ${context.category}; ${context.exerciseType}`,
    `Difficulty and safety context: ${context.difficulty}; risk ${context.riskLevel}; minimum age ${context.minimumAge ?? "not specified"}; supervision ${context.supervision}.`,
    `Impact and coordination: ${context.impactLevel}; ${context.coordinationComplexity}.`,
    `Space and environment: ${context.spaceRequirement}; indoor suitable ${context.suitableIndoors}; outdoor suitable ${context.suitableOutdoors}.`,
    section("Equipment", equipment),
    section("Primary and secondary body regions", bodyRegions),
    section("Movement patterns", movementPatterns),
    renderGuidance("de", localized.de),
    renderGuidance("en", localized.en),
    "Depict one representative execution moment per person, unless the ordered instructions require a visible start-to-finish sequence to make the movement understandable. If a sequence is needed, show only two small sequential poses inside each person's panel without adding extra people.",
    "Safety is more important than dramatic action: show stable footing, controlled range, clear space and the stated supervision context. Do not depict pain, unsafe loading, a fall, collision, or an unlisted obstacle configuration.",
  ].join("\n\n");
}
