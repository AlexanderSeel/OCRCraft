export type ExerciseFigurePresentation = "adult_woman" | "adult_man";

export const ocrcraftExerciseIllustrationV2 = {
  id: "ocrcraft-exercise-illustration-v2",
  label: "OCRCraft Exercise Sequence v2",
  prompt: [
    "Create a clear instructional movement storyboard for OCRCraft, a German recreational-sport and obstacle-course training planner.",
    "Illustration type: friendly flat editorial artwork with anatomically readable movement, crisp dark outlines, warm skin tones, solid color fills and a plain warm-white background. Keep the movement demonstration prominent.",
    "Clothing: dark navy functional OCR sportswear with restrained coral-red panels, consistent across every frame. No logos, lettering, headbands, brands or unrelated carried objects; keep the rendering illustrated rather than photographic.",
    "Use readable silhouettes, consistent adult body proportions and only the floor, safety spacing and equipment needed to explain the exercise. No decorative clutter or captions.",
  ].join(" "),
} as const;

export function chooseRandomExerciseFigurePresentation(): ExerciseFigurePresentation {
  return Math.random() < 0.5 ? "adult_woman" : "adult_man";
}
