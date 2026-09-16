"use client";

import { MuscleMap, type MuscleMapOption } from "@/components/body/muscle-map";

const bodyRegions: readonly MuscleMapOption[] = [
  { id: "full-body", labelDe: "Ganzkörper", labelEn: "Full Body" },
  { id: "neck", labelDe: "Nacken", labelEn: "Neck" },
  { id: "traps", labelDe: "Trapezmuskel", labelEn: "Trapezius" },
  { id: "shoulders", labelDe: "Schultern", labelEn: "Shoulders" },
  { id: "rear-delts", labelDe: "Hintere Schulter", labelEn: "Rear Deltoids" },
  { id: "chest", labelDe: "Brust", labelEn: "Chest" },
  { id: "upper-back", labelDe: "Oberer Rücken", labelEn: "Upper Back" },
  { id: "lats", labelDe: "Latissimus", labelEn: "Lats" },
  { id: "upper-arms", labelDe: "Oberarme", labelEn: "Upper Arms" },
  { id: "biceps", labelDe: "Bizeps", labelEn: "Biceps" },
  { id: "triceps", labelDe: "Trizeps", labelEn: "Triceps" },
  { id: "forearms-grip", labelDe: "Unterarme / Grip", labelEn: "Forearms / Grip" },
  { id: "core", labelDe: "Core", labelEn: "Core" },
  { id: "abs", labelDe: "Bauchmuskulatur", labelEn: "Abdominals" },
  { id: "obliques", labelDe: "Seitlicher Core", labelEn: "Obliques" },
  { id: "lower-back", labelDe: "Unterer Rücken", labelEn: "Lower Back" },
  { id: "hips", labelDe: "Hüfte", labelEn: "Hips" },
  { id: "glutes", labelDe: "Gesäß", labelEn: "Glutes" },
  { id: "quadriceps", labelDe: "Oberschenkel vorn", labelEn: "Quadriceps" },
  { id: "hamstrings", labelDe: "Oberschenkel hinten", labelEn: "Hamstrings" },
  { id: "adductors", labelDe: "Adduktoren", labelEn: "Adductors" },
  { id: "calves", labelDe: "Waden", labelEn: "Calves" },
  { id: "tibialis", labelDe: "Schienbein / Tibialis", labelEn: "Tibialis Anterior" },
  { id: "ankles-feet", labelDe: "Sprunggelenke / Füße", labelEn: "Ankles / Feet" },
];

interface BodyFocusSelectorProps {
  readonly selected: readonly string[];
  readonly onToggle: (regionId: string) => void;
}

export function BodyFocusSelector({ selected, onToggle }: BodyFocusSelectorProps) {
  return (
    <MuscleMap
      description="Wähle die Muskel- und Körperregionen, die im Training gezielt berücksichtigt werden sollen. Die Karte dient der Trainingsplanung, nicht der medizinischen Anatomie."
      mode="select"
      onChange={(next) => {
        const current = new Set(selected);
        const nextIds = new Set(next.map((item) => item.id));
        const changed = bodyRegions.find((region) => current.has(region.id) !== nextIds.has(region.id));
        if (changed) onToggle(changed.id);
      }}
      options={bodyRegions}
      title="Körper- und Muskelfokus"
      value={selected.map((id) => ({ id }))}
    />
  );
}
