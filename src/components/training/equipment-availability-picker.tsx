export interface EquipmentAvailabilityOption {
  readonly id: string;
  readonly name: string;
  readonly quantityAvailable: number | null;
}

interface EquipmentAvailabilityPickerProps {
  readonly options: readonly EquipmentAvailabilityOption[];
  readonly value: Readonly<Record<string, string>>;
  readonly onChange: (equipmentId: string, quantity: string) => void;
}

export function EquipmentAvailabilityPicker({ options, value, onChange }: EquipmentAvailabilityPickerProps) {
  if (options.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Im Equipment-Katalog ist noch kein Material angelegt.</p>;
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <li className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" key={option.id}>
          <label className="text-sm font-semibold" htmlFor={`available-equipment-${option.id}`}>
            {option.name}
          </label>
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
  );
}
