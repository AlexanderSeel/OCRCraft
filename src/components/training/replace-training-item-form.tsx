"use client";

import { useState } from "react";
import { replaceTrainingItemExerciseAction } from "@/app/training/[id]/replace-action";
import { Disclosure } from "@/components/ui/disclosure";
import {
  ExerciseAutocompletePicker,
  type SelectedExerciseReference,
} from "./exercise-autocomplete-picker";

interface ReplaceTrainingItemFormProps {
  readonly sessionId: string;
  readonly itemId: string;
  readonly currentExerciseName: string;
}

export function ReplaceTrainingItemForm({
  sessionId,
  itemId,
  currentExerciseName,
}: ReplaceTrainingItemFormProps) {
  const [selected, setSelected] = useState<readonly SelectedExerciseReference[]>([]);

  return (
    <Disclosure className="rounded-lg border border-[var(--border)] bg-[var(--surface)]" summaryClassName="px-3 py-2 text-xs font-black" summary="Übung ersetzen">
      <form action={replaceTrainingItemExerciseAction} className="grid gap-3 border-t border-[var(--border)] p-3">
        <input name="sessionId" type="hidden" value={sessionId} />
        <input name="itemId" type="hidden" value={itemId} />
        <input name="exerciseId" type="hidden" value={selected[0]?.id ?? ""} />
        <ExerciseAutocompletePicker
          description={`Aktuell: ${currentExerciseName}. Wähle genau eine andere Bibliotheksübung.`}
          label="Neue Übung / neues Hindernis"
          maxItems={1}
          onChange={setSelected}
          selected={selected}
        />
        <div className="flex justify-end">
          <button
            className="rounded-lg bg-[var(--control-strong)] px-4 py-2 text-xs font-black text-[var(--control-strong-foreground)] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={selected.length !== 1}
            type="submit"
          >
            Übung ersetzen
          </button>
        </div>
      </form>
    </Disclosure>
  );
}
