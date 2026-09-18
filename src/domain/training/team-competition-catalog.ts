import type { MainPartProgramming, TrainingFormat } from "./model";

export const TEAM_COMPETITION_STYLE_KEYS = [
  "triad-specialists",
  "triad-rotation",
  "relay-gauntlet-4",
  "duo-switch",
  "checkpoint-endurance-3",
] as const;

export type TeamCompetitionStyleKey = (typeof TEAM_COMPETITION_STYLE_KEYS)[number];

export interface TeamCompetitionStyle {
  readonly key: TeamCompetitionStyleKey;
  readonly titleDe: string;
  readonly titleEn: string;
  readonly descriptionDe: string;
  readonly teamSize: number;
  readonly minimumAge: number;
  readonly goals: readonly string[];
  readonly formats: readonly TrainingFormat[];
  readonly intensity: "technique" | "balanced" | "conditioning";
  readonly mainPartTitlesDe: readonly string[];
  readonly mainPartExerciseCounts: readonly number[];
  readonly mainPartProgramming: readonly MainPartProgramming[];
  readonly coachNotesDe: readonly string[];
}

export const TEAM_COMPETITION_STYLES: readonly TeamCompetitionStyle[] = [
  {
    key: "triad-specialists",
    titleDe: "3er-Spezialisten · Kraft · Schnelligkeit · Technik",
    titleEn: "Triad Specialists · Strength · Speed · Skill",
    descriptionDe: "Drei Personen bilden ein Team. Jede Person übernimmt zunächst ihren Spezialkomplex; danach beendet das Team die Einheit gemeinsam. Die Komplexe können über die Rundenprogrammierung mehrfach durchlaufen werden.",
    teamSize: 3,
    minimumAge: 16,
    goals: ["Teamwork", "Kraftausdauer", "Koordination", "OCR-Technik"],
    formats: ["team-competition"],
    intensity: "balanced",
    mainPartTitlesDe: ["Komplex 1 · Kraft", "Komplex 2 · Schnelligkeit", "Komplex 3 · Technik", "Team-Finisher · gemeinsam"],
    mainPartExerciseCounts: [2, 2, 2, 2],
    mainPartProgramming: [
      { mode: "rounds", rounds: 2, scoreMode: "quality" },
      { mode: "interval", workSeconds: 30, restSeconds: 30 },
      { mode: "rounds", rounds: 2, scoreMode: "quality" },
      { mode: "chipper" },
    ],
    coachNotesDe: [
      "Vor Start legt jedes Team fest, wer Kraft, Schnelligkeit und Technik übernimmt.",
      "Nach einer vollständigen Wettkampfrunde können die Rollen rotieren.",
      "Der gemeinsame Finisher zählt nur, wenn alle drei Teammitglieder beteiligt sind.",
    ],
  },
  {
    key: "triad-rotation",
    titleDe: "3er-Rotation · alle drei Komplexe",
    titleEn: "Triad Rotation · All Three Complexes",
    descriptionDe: "Dreierteams rotieren durch Kraft-, Lauf-/Speed- und Technikblöcke. Jede Person absolviert jeden Komplex; die Teamwertung entsteht aus sauberer gemeinsamer Gesamtleistung.",
    teamSize: 3,
    minimumAge: 14,
    goals: ["Teamwork", "Ganzkörper", "Laufen", "OCR-Technik"],
    formats: ["team-competition", "circuit"],
    intensity: "balanced",
    mainPartTitlesDe: ["Rotation A · Kraft", "Rotation B · Speed", "Rotation C · OCR-Technik", "Team-Finisher · synchron"],
    mainPartExerciseCounts: [2, 2, 2, 2],
    mainPartProgramming: [
      { mode: "rounds", rounds: 1, scoreMode: "quality" },
      { mode: "interval", workSeconds: 40, restSeconds: 20 },
      { mode: "rounds", rounds: 1, scoreMode: "quality" },
      { mode: "rounds", rounds: 2, scoreMode: "quality" },
    ],
    coachNotesDe: ["Teams wechseln geschlossen zwischen den Komplexen.", "Technikfehler werden nicht durch Geschwindigkeit kompensiert."],
  },
  {
    key: "relay-gauntlet-4",
    titleDe: "4er Relay Gauntlet",
    titleEn: "Four-Person Relay Gauntlet",
    descriptionDe: "Viererteam mit kurzen Einzelaufgaben aus Speed, Carry, OCR-Technik und anschließendem Teamabschnitt. Geeignet für Staffelcharakter mit klaren Übergabezonen.",
    teamSize: 4,
    minimumAge: 16,
    goals: ["Teamwork", "Laufen", "Kraftausdauer", "OCR-Technik"],
    formats: ["team-competition", "relay"],
    intensity: "conditioning",
    mainPartTitlesDe: ["Relay 1 · Speed", "Relay 2 · Carry & Kraft", "Relay 3 · OCR-Technik", "Relay 4 · Team-Gauntlet"],
    mainPartExerciseCounts: [2, 2, 2, 2],
    mainPartProgramming: [
      { mode: "interval", workSeconds: 30, restSeconds: 30 },
      { mode: "rounds", rounds: 2, scoreMode: "quality" },
      { mode: "rounds", rounds: 2, scoreMode: "quality" },
      { mode: "chipper" },
    ],
    coachNotesDe: ["Übergaben nur in markierten Zonen.", "Stationskapazität und Equipmentmenge bleiben harte Grenzen."],
  },
  {
    key: "duo-switch",
    titleDe: "2er Switch-Duell",
    titleEn: "Duo Switch Challenge",
    descriptionDe: "Zweierteams teilen zwei unterschiedliche Belastungskomplexe und wechseln anschließend die Rollen. Zum Abschluss folgt ein gemeinsamer Qualitätsblock.",
    teamSize: 2,
    minimumAge: 14,
    goals: ["Teamwork", "Kraftausdauer", "Koordination"],
    formats: ["team-competition", "partner"],
    intensity: "balanced",
    mainPartTitlesDe: ["Rolle A · Kraft/Carry", "Rolle B · Speed/Koordination", "Rollenwechsel", "Partner-Finisher"],
    mainPartExerciseCounts: [2, 2, 2, 2],
    mainPartProgramming: [
      { mode: "rounds", rounds: 2, scoreMode: "quality" },
      { mode: "interval", workSeconds: 40, restSeconds: 20 },
      { mode: "rounds", rounds: 1, scoreMode: "quality" },
      { mode: "chipper" },
    ],
    coachNotesDe: ["Nach dem zweiten Block werden die Rollen zwingend getauscht.", "Kein erzwungener Körperkontakt."],
  },
  {
    key: "checkpoint-endurance-3",
    titleDe: "3er Team Checkpoint Endurance",
    titleEn: "Three-Person Checkpoint Endurance",
    descriptionDe: "Dreierteams verbinden Laufabschnitte mit Checkpoints aus Kraft und OCR-Technik. An jedem Checkpoint arbeitet das Team nach klarer Rollenverteilung zusammen.",
    teamSize: 3,
    minimumAge: 16,
    goals: ["Teamwork", "Laufen", "Kraftausdauer", "OCR-Technik"],
    formats: ["team-competition", "run-exercise"],
    intensity: "conditioning",
    mainPartTitlesDe: ["Checkpoint-Runde · Run", "Checkpoint · Kraft", "Checkpoint · OCR-Technik", "Gemeinsame Schlussrunde"],
    mainPartExerciseCounts: [1, 2, 2, 2],
    mainPartProgramming: [
      { mode: "every", everyValue: 500, everyUnit: "metres" },
      { mode: "rounds", rounds: 2, scoreMode: "quality" },
      { mode: "rounds", rounds: 2, scoreMode: "quality" },
      { mode: "rounds", rounds: 1, scoreMode: "quality" },
    ],
    coachNotesDe: ["Laufgeschwindigkeit wird am langsamsten Teammitglied ausgerichtet.", "Checkpoints beginnen erst, wenn das Team vollständig angekommen ist."],
  },
];

export function getTeamCompetitionStyle(key: string | undefined): TeamCompetitionStyle | undefined {
  return TEAM_COMPETITION_STYLES.find((style) => style.key === key);
}
