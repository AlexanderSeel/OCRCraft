import type { TrainingExerciseGuidance } from "@/server/training/training-exercise-guidance-repository";
import styles from "./training-print.module.css";

const labels = {
  de: { safety: "Sicherheit", prerequisites: "Voraussetzungen", recovery: "Belastung / Pause", alternative: "Alternative", youth: "Kinder / Jugend", supervision: "Aufsicht", surface: "Untergrund / Wetter" },
  en: { safety: "Safety", prerequisites: "Prerequisites", recovery: "Work / rest", alternative: "Alternative", youth: "Children / youth", supervision: "Supervision", surface: "Surface / weather" },
} as const;

const supervisionLabels: Readonly<Record<"de" | "en", Readonly<Record<string, string>>>> = {
  de: { normal: "Reguläre Aufsicht", increased: "Erhöhte Aufsicht", direct: "Direkte Aufsicht" },
  en: { normal: "Normal supervision", increased: "Increased supervision", direct: "Direct supervision" },
};

/** Concise session instructions; safety and trainer text are never truncated. */
export function TrainingPrintGuidance({ guidance, trainerInstructions, locale }: {
  readonly guidance?: TrainingExerciseGuidance;
  readonly trainerInstructions: string | null;
  readonly locale: "de" | "en";
}) {
  const text = labels[locale];
  return <div className={styles.compactGuidance}>
    {guidance?.summary && guidance.summary !== trainerInstructions ? <p>{guidance.summary}</p> : null}
    {trainerInstructions ? <p className={styles.instructions}>{trainerInstructions}</p> : guidance?.executionSteps.length ? <ol>{guidance.executionSteps.map((step, index) => <li key={index}>{step}</li>)}</ol> : null}
    {guidance ? <>
      <div className={styles.levels}>{[guidance.level1, guidance.level2, guidance.level3].map((level, index) => level ? <p key={index}><strong>L{index + 1}</strong> {level}</p> : null)}</div>
      {guidance.workRestGuidance ? <p><strong>{text.recovery}: </strong>{guidance.workRestGuidance}</p> : null}
      {guidance.safetyNotes ? <p className={styles.safety}><strong>{text.safety}: </strong>{guidance.safetyNotes}</p> : null}
      {guidance.prerequisites ? <p><strong>{text.prerequisites}: </strong>{guidance.prerequisites}</p> : null}
      {guidance.supervision ? <p><strong>{text.supervision}: </strong>{supervisionLabels[locale][guidance.supervision] ?? guidance.supervision}</p> : null}
      {guidance.surfaceRequirements || guidance.weatherTerrain ? <p><strong>{text.surface}: </strong>{[guidance.surfaceRequirements, guidance.weatherTerrain].filter(Boolean).join(" · ")}</p> : null}
      {guidance.childYouthVariant ? <p><strong>{text.youth}: </strong>{guidance.childYouthVariant}</p> : null}
      {guidance.fallbackExercise ? <p><strong>{text.alternative}: </strong>{guidance.fallbackExercise}</p> : null}
    </> : null}
  </div>;
}
