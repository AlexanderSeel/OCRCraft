"use client";

import { useMemo, useState } from "react";
import type { EquipmentPortability } from "@/domain/equipment-portability";

export interface EquipmentAvailabilityOption {
  readonly id: string;
  readonly seedKey: string | null;
  readonly name: string;
  readonly quantityAvailable: number | null;
  readonly portability: EquipmentPortability;
}

interface EquipmentAvailabilityPickerProps {
  readonly options: readonly EquipmentAvailabilityOption[];
  readonly value: Readonly<Record<string, string>>;
  readonly onChange: (equipmentId: string, quantity: string) => void;
  readonly defaultPortableOnly?: boolean;
}

export function EquipmentAvailabilityPicker({
  options,
  value,
  onChange,
  defaultPortableOnly = false,
}: EquipmentAvailabilityPickerProps) {
  const [portableOnly, setPortableOnly] = useState(defaultPortableOnly);
  const visibleOptions = useMemo(
    () => options.filter((option) => !portableOnly || option.portability === "portable"),
    [options, portableOnly],
  );
  const portableCount = useMemo(
    () => options.filter((option) => option.portability === "portable").length,
    [options],
  );

  if (options.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Im Equipment-Katalog ist noch kein Material angelegt.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div>
          <div className="text-sm font-black">Materialverfügbarkeit</div>
          <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
            Bestand je Material. Portables Equipment ist explizit markiert; unbekannte Einträge werden nicht automatisch als portabel behandelt.
          </p>
        </div>
        <label className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 text-xs font-black">
          <input
            checked={portableOnly}
            onChange={(event) => setPortableOnly(event.target.checked)}
            type="checkbox"
          />
          Nur portabel ({portableCount})
        </label>
      </div>

      {visibleOptions.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--muted)]">
          Für diesen Filter ist kein Equipment hinterlegt.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visibleOptions.map((option) => (
            <li className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" key={option.id}>
              <div className="min-w-0">
                <label className="block truncate text-sm font-semibold" htmlFor={`available-equipment-${option.id}`}>
                  {option.name}
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[var(--muted)]">
                  <span className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-1.5 py-0.5">
                    {portabilityLabel(option.portability)}
                  </span>
                  <span>Bestand: {option.quantityAvailable == null ? "unbekannt" : option.quantityAvailable}</span>
                </div>
              </div>
              <input
                aria-label={`Verfügbare Menge: ${option.name}`}
                className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm outline-none focus:border-[var(--focus)]"
                id={`available-equipment-${option.id}`}
                max={500}
                min={0}
                onChange={(event) => onChange(option.id, event.target.value)}
                placeholder={option.quantityAvailable == null ? "unbekannt" : String(option.quantityAvailable)}
                step={1}
                type="number"
                value={value[option.id] ?? ""}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function portabilityLabel(portability: EquipmentPortability): string {
  if (portability === "portable") return "Portabel";
  if (portability === "fixed") return "Fest / Rig";
  return "Nicht klassifiziert";
}
