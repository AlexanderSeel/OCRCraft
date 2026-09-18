export const TRAINER_QUALIFICATION_LEVELS = [
  "none",
  "assistant",
  "trainer_c",
  "trainer_b",
  "trainer_a",
] as const;

export type TrainerQualificationLevel = (typeof TRAINER_QUALIFICATION_LEVELS)[number];

const ORDER: Readonly<Record<TrainerQualificationLevel, number>> = {
  none: 0,
  assistant: 1,
  trainer_c: 2,
  trainer_b: 3,
  trainer_a: 4,
};

export const TRAINER_QUALIFICATION_LABELS: Readonly<Record<TrainerQualificationLevel, string>> = {
  none: "Keine strukturierte Qualifikation",
  assistant: "Trainer-Assistenz",
  trainer_c: "Trainer C",
  trainer_b: "Trainer B",
  trainer_a: "Trainer A",
};

export function trainerQualificationMeets(
  actual: TrainerQualificationLevel,
  required: TrainerQualificationLevel,
): boolean {
  return ORDER[actual] >= ORDER[required];
}

export function trainerQualificationBlockReason(
  actual: TrainerQualificationLevel,
  required: TrainerQualificationLevel,
  context: string,
): string | null {
  if (trainerQualificationMeets(actual, required)) return null;
  return `${context} benötigt mindestens ${TRAINER_QUALIFICATION_LABELS[required]}; aktuell hinterlegt ist ${TRAINER_QUALIFICATION_LABELS[actual]}.`;
}
