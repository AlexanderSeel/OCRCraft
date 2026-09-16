import type { ExerciseImageGenerationContext, LocalizedExerciseImageGuidance } from "./exercise-image-types";
import type { ExerciseFigurePresentation } from "./ocrcraft-exercise-illustration-v2";
import { ocrcraftExerciseIllustrationV2 } from "./ocrcraft-exercise-illustration-v2";

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

export function buildExerciseImagePrompt(
  context: ExerciseImageGenerationContext,
  figurePresentation: ExerciseFigurePresentation,
): string {
  const { localized } = context;
  const equipment = context.equipment.map((item) => `${item.nameDe} / ${item.nameEn} (quantity ${item.quantity})`).join(", ");
  const bodyRegions = context.bodyRegions.map((region) => `${region.emphasis}: ${region.labelDe} / ${region.labelEn}`).join(", ");
  const movementPatterns = context.movementPatterns.map((pattern) => `${pattern.labelDe} / ${pattern.labelEn}`).join(", ");

  return [
    ocrcraftExerciseIllustrationV2.prompt,
    `Use one randomly selected adult presentation for the main demonstrator: ${figurePresentation === "adult_woman" ? "an adult woman" : "an adult man"}. Keep that same main demonstrator in every frame; never show a child or a male/female comparison lineup.`,
    "Show only the participants the exercise itself requires. Partner or team participants may appear as supporting people when the structured setup or execution steps require them; do not add extra people for representation.",
    `Create exactly ${localized.de.executionSteps.length} sequential frames in reading order, one frame for each numbered item in the structured execution steps. Use a clear left-to-right storyboard with small unobtrusive step numbers and simple directional arrows where they clarify motion.`,
    "Keep the same athlete, clothing, equipment, camera angle and scale in every frame. Make the change in body position between consecutive frames clear and biomechanically plausible.",
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
    "The ordered execution steps are the source of truth for the sequence. Each frame must depict its corresponding step; do not collapse the exercise into one pose, add unlisted movements, or invent extra stages. The image explains movement over time and is not a comparison of people.",
    "Never invent physical contact: only show touching, high-fives, grabbing or shared contact when a structured execution step explicitly requires it. Respect all stated distance and no-contact rules in every frame.",
    "Safety is more important than dramatic action: show stable footing, controlled range, clear space and the stated supervision context. Do not depict pain, unsafe loading, a fall, collision, or an unlisted obstacle configuration.",
  ].join("\n\n");
}
