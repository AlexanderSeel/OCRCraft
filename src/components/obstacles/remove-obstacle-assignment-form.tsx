"use client";

import { removeExerciseFromObstaclesAction } from "@/app/obstacles/actions";
import { ConfirmPopoverForm } from "@/components/ui/confirm-popover-form";

interface Props {
  readonly exerciseId: string;
  readonly exerciseName: string;
}

export function RemoveObstacleAssignmentForm({ exerciseId, exerciseName }: Props) {
  return (
    <ConfirmPopoverForm
      action={removeExerciseFromObstaclesAction}
      description={`„${exerciseName}“ wird aus dem Hinderniskatalog entfernt. Die Übung selbst bleibt erhalten.`}
      title="Hindernis-Zuordnung entfernen?"
      triggerLabel="Aus Hindernissen entfernen"
    >
      <input name="exerciseId" type="hidden" value={exerciseId} />
    </ConfirmPopoverForm>
  );
}
