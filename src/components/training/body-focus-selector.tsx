"use client";

import { MuscleMap } from "@/components/body/muscle-map";
import { BODY_REGION_OPTIONS } from "@/domain/body-regions";

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
        const changed = BODY_REGION_OPTIONS.find((region) => current.has(region.id) !== nextIds.has(region.id));
        if (changed) onToggle(changed.id);
      }}
      options={BODY_REGION_OPTIONS}
      title="Körper- und Muskelfokus"
      value={selected.map((id) => ({ id }))}
    />
  );
}
