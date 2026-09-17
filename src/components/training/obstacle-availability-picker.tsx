"use client";

import type { TrainingObstacleOption } from "@/server/training/training-draft-repository";

interface ObstacleAvailabilityPickerProps {
  readonly options: readonly TrainingObstacleOption[];
  readonly declared: boolean;
  readonly selectedIds: readonly string[];
  readonly onDeclaredChange: (declared: boolean) => void;
  readonly onSelectionChange: (ids: readonly string[]) => void;
}

export function ObstacleAvailabilityPicker({
  options,
  declared,
  selectedIds,
  onDeclaredChange,
  onSelectionChange,
}: ObstacleAvailabilityPickerProps) {
  const selected = new Set(selectedIds);

  function toggle(id: string) {
    onSelectionChange(selected.has(id)
      ? selectedIds.filter((candidate) => candidate !== id)
      : [...selectedIds, id]);
  }

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
        <input
          checked={declared}
          className="mt-1"
          onChange={(event) => onDeclaredChange(event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="block font-black">Vereins-Hindernisbestand berücksichtigen</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
            Wenn aktiv, sind OCR-Hindernisübungen nur erlaubt, wenn die zugehörige Station unten verfügbar ist. Normale Übungen bleiben davon unberührt.
          </span>
        </span>
      </label>

      {declared ? (
        options.length > 0 ? (
          <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {options.map((option) => (
              <label
                className={`flex gap-3 rounded-lg border p-3 text-sm ${selected.has(option.id) ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface)]"}`}
                key={option.id}
              >
                <input checked={selected.has(option.id)} onChange={() => toggle(option.id)} type="checkbox" />
                <span className="min-w-0">
                  <span className="block font-black">{option.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                    {metadata(option)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[var(--border)] p-3 text-xs text-[var(--muted)]">
            Im aktuellen Katalog sind keine Übungen mit strukturierter Hindernis-Guidance vorhanden.
          </p>
        )
      ) : null}
    </div>
  );
}

function metadata(option: TrainingObstacleOption): string {
  const parts: string[] = [];
  if (option.stationCapacity != null) parts.push(`Kapazität ${option.stationCapacity}`);
  if (option.heightCm != null) parts.push(`Höhe ${option.heightCm} cm`);
  if (option.spanCm != null) parts.push(`Spannweite ${option.spanCm} cm`);
  if (option.reachCm != null) parts.push(`Reichhöhe ${option.reachCm} cm`);
  return parts.length > 0 ? parts.join(" · ") : "OCR-Hindernisstation";
}
