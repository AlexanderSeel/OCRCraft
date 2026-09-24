"use client";

import { useMemo, useState } from "react";
import type {
  OutdoorVariantEquipmentOption,
  OutdoorVariantEquipmentSelection,
} from "@/server/exercises/exercise-outdoor-variant-repository";
import type { EquipmentPortability } from "@/domain/equipment-portability";

interface OutdoorEquipmentPickerProps {
  readonly options: readonly OutdoorVariantEquipmentOption[];
  readonly selectedEquipment: readonly OutdoorVariantEquipmentSelection[];
  readonly disabled?: boolean;
}

export function OutdoorEquipmentPicker({
  options,
  selectedEquipment,
  disabled = false,
}: OutdoorEquipmentPickerProps) {
  const selected = useMemo(
    () => new Map(selectedEquipment.map((item) => [item.id, item.quantityRequired])),
    [selectedEquipment],
  );
  const hasSelectedNonPortable = selectedEquipment.some((item) => {
    const option = options.find((candidate) => candidate.id === item.id);
    return option?.portability !== "portable";
  });
  const [portableOnly, setPortableOnly] = useState(!hasSelectedNonPortable);
  const portableCount = options.filter((option) => option.portability === "portable").length;
  const visibleOptions = options.filter(
    (option) => !portableOnly || option.portability === "portable" || selected.has(option.id),
  );

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
        <p className="max-w-2xl text-xs leading-5 text-[var(--muted)]">
          Der Filter zeigt transportierbares Hallen-/Outdoor-Material. Bereits ausgewähltes festes oder unklassifiziertes Equipment bleibt sichtbar, damit beim Filtern keine Auswahl unbemerkt verloren geht.
        </p>
        <label className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black">
          <input
            checked={portableOnly}
            disabled={disabled}
            onChange={(event) => setPortableOnly(event.target.checked)}
            type="checkbox"
          />
          Nur portabel ({portableCount})
        </label>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {visibleOptions.map((option) => {
          const quantity = selected.get(option.id);
          return (
            <div className="grid grid-cols-[auto_minmax(0,1fr)_76px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3" key={option.id}>
              <input
                aria-label={`${option.labelDe} verwenden`}
                defaultChecked={quantity != null}
                disabled={disabled}
                name="equipmentId"
                type="checkbox"
                value={option.id}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{option.labelDe}</div>
                <div className="truncate text-xs text-[var(--muted)]">
                  {option.labelEn}{option.seedKey ? ` · ${option.seedKey}` : ""}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold text-[var(--muted)]">
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5">
                    {portabilityLabel(option.portability)}
                  </span>
                  <span>Bestand: {option.quantityAvailable == null ? "unbekannt" : option.quantityAvailable}</span>
                </div>
              </div>
              <input
                aria-label={`Menge ${option.labelDe}`}
                className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                defaultValue={quantity ?? 1}
                disabled={disabled}
                max={99}
                min={1}
                name={`quantity:${option.id}`}
                type="number"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function portabilityLabel(portability: EquipmentPortability): string {
  if (portability === "portable") return "Portabel";
  if (portability === "fixed") return "Fest / Rig";
  return "Nicht klassifiziert";
}
