import Link from "next/link";
import { replaceTrainingItemExerciseAction } from "@/app/training/[id]/replace-action";
import {
  listTrainingItemAlternatives,
  type TrainingAlternativeMode,
  type TrainingItemAlternative,
} from "@/server/training/training-item-alternative-repository";

const MODES: readonly {
  readonly id: TrainingAlternativeMode;
  readonly label: string;
  readonly description: string;
}[] = [
  { id: "easier", label: "Leichter", description: "Verwandte Übung mit niedrigerer Schwierigkeit bevorzugen." },
  { id: "harder", label: "Schwerer", description: "Verwandte Übung mit höherer Schwierigkeit bevorzugen." },
  { id: "equipment", label: "Ohne / weniger Equipment", description: "Alternative mit geringerem Materialbedarf bevorzugen." },
];

interface TrainingItemAlternativesProps {
  readonly sessionId: string;
  readonly itemId: string;
  readonly currentExerciseName: string;
  readonly activeItemId?: string;
  readonly activeMode?: string;
}

export async function TrainingItemAlternatives({
  sessionId,
  itemId,
  currentExerciseName,
  activeItemId,
  activeMode,
}: TrainingItemAlternativesProps) {
  const mode = MODES.find((entry) => entry.id === activeMode)?.id;
  const active = activeItemId === itemId && mode != null;
  const alternatives = active
    ? await listTrainingItemAlternatives(sessionId, itemId, mode, 8)
    : [];

  return (
    <details
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)]"
      open={active}
    >
      <summary className="cursor-pointer px-3 py-2 text-xs font-black">
        Schnell-Alternativen
      </summary>
      <div className="space-y-3 border-t border-[var(--border)] p-3">
        <div>
          <div className="text-xs font-bold text-[var(--muted)]">Aktuell</div>
          <div className="mt-0.5 text-sm font-black">{currentExerciseName}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {MODES.map((entry) => {
            const selected = activeItemId === itemId && mode === entry.id;
            return (
              <Link
                aria-current={selected ? "true" : undefined}
                className={`rounded-lg border px-3 py-2 text-xs font-black ${
                  selected
                    ? "border-[var(--control-strong)] bg-[var(--control-strong)] text-[var(--control-strong-foreground)]"
                    : "border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-elevated)]"
                }`}
                href={`/training/${sessionId}?alternativeItem=${itemId}&alternativeMode=${entry.id}#item-${itemId}`}
                key={entry.id}
                title={entry.description}
              >
                {entry.label}
              </Link>
            );
          })}
        </div>

        {active ? (
          alternatives.length > 0 ? (
            <div className="grid gap-2">
              {alternatives.map((alternative) => (
                <AlternativeRow
                  alternative={alternative}
                  itemId={itemId}
                  key={alternative.exerciseId}
                  sessionId={sessionId}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--border)] p-3 text-xs leading-5 text-[var(--muted)]">
              Für diese Auswahl wurde keine passende Alternative gefunden.
            </div>
          )
        ) : (
          <p className="text-xs leading-5 text-[var(--muted)]">
            Wähle eine Richtung. Die Vorschläge berücksichtigen Trainingsbereich, Bewegungsmuster,
            Körperregionen, Schwierigkeit und Equipment-Bedarf.
          </p>
        )}
      </div>
    </details>
  );
}

function AlternativeRow({
  alternative,
  sessionId,
  itemId,
}: {
  readonly alternative: TrainingItemAlternative;
  readonly sessionId: string;
  readonly itemId: string;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="font-black">{alternative.name}</div>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-bold text-[var(--muted)]">
          <span>{alternative.category}</span>
          <span>· {difficultyLabel(alternative.difficulty)}</span>
          {alternative.equipment.length > 0 ? (
            <span>· {alternative.equipment.join(", ")}</span>
          ) : (
            <span>· ohne Equipment</span>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{alternative.reason}</p>
      </div>
      <form action={replaceTrainingItemExerciseAction}>
        <input name="sessionId" type="hidden" value={sessionId} />
        <input name="itemId" type="hidden" value={itemId} />
        <input name="exerciseId" type="hidden" value={alternative.exerciseId} />
        <button
          className="w-full rounded-lg bg-[var(--control-strong)] px-3 py-2 text-xs font-black text-[var(--control-strong-foreground)] sm:w-auto"
          type="submit"
        >
          Übernehmen
        </button>
      </form>
    </div>
  );
}

function difficultyLabel(value: string): string {
  if (value === "beginner") return "Einsteiger";
  if (value === "intermediate") return "Mittel";
  if (value === "advanced") return "Fortgeschritten";
  return value;
}
