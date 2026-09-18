"use client";

import { useState } from "react";
import { removeExerciseFromObstaclesAction } from "@/app/obstacles/actions";

interface Props {
  readonly exerciseId: string;
  readonly exerciseName: string;
}

export function RemoveObstacleAssignmentForm({ exerciseId, exerciseName }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={removeExerciseFromObstaclesAction} className="flex flex-wrap items-center gap-2">
      <input name="exerciseId" type="hidden" value={exerciseId} />
      {confirming ? (
        <>
          <span className="max-w-52 text-xs font-bold text-[var(--danger)]">
            „{exerciseName}“ wirklich aus dem Hinderniskatalog entfernen?
          </span>
          <button className="min-h-9 rounded-lg bg-[var(--danger)] px-3 py-2 text-xs font-black text-white" type="submit">
            Ja, Zuordnung entfernen
          </button>
          <button
            className="min-h-9 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black"
            onClick={() => setConfirming(false)}
            type="button"
          >
            Abbrechen
          </button>
        </>
      ) : (
        <button
          className="min-h-9 rounded-lg border border-[var(--danger)] px-3 py-2 text-xs font-black text-[var(--danger)]"
          onClick={() => setConfirming(true)}
          type="button"
        >
          Aus Hindernissen entfernen
        </button>
      )}
    </form>
  );
}
