import { OutdoorEquipmentPicker } from "@/components/exercises/outdoor-equipment-picker";
import { buttonClass } from "@/components/ui/form";
import type { ExerciseOutdoorVariantEditorData } from "@/server/exercises/exercise-outdoor-variant-repository";

interface ExerciseOutdoorVariantEditorProps {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly data: ExerciseOutdoorVariantEditorData;
  readonly disabled?: boolean;
}

export function ExerciseOutdoorVariantEditor({
  action,
  data,
  disabled = false,
}: ExerciseOutdoorVariantEditorProps) {
  return (
    <form action={action} className="mt-4 space-y-5">
      <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
        <input
          className="mt-1 size-4"
          defaultChecked={data.enabled}
          disabled={disabled}
          name="enabled"
          type="checkbox"
        />
        <span>
          <span className="block font-black">Outdoor-Variante freigeben</span>
          <span className="mt-1 block text-sm leading-5 text-[var(--muted)]">
            Ist die Variante aktiv, darf der Training Builder diese Übung bei Outdoor-Planung verwenden. Originalausführung und Original-Equipment bleiben unverändert.
          </span>
        </span>
      </label>

      <div className="grid gap-4 xl:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">
          Outdoor-Ausführung · Deutsch
          <textarea
            className="min-h-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-normal leading-6 outline-none focus:border-[var(--focus)]"
            defaultValue={data.textDe}
            disabled={disabled}
            maxLength={4000}
            name="textDe"
            placeholder="z. B. Kabelzug durch Widerstandsband an sicherem Fixpunkt ersetzen …"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Outdoor-Ausführung · Englisch
          <textarea
            className="min-h-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-normal leading-6 outline-none focus:border-[var(--focus)]"
            defaultValue={data.textEn}
            disabled={disabled}
            maxLength={4000}
            name="textEn"
            placeholder="e.g. replace the cable station with a resistance band on a safe anchor …"
          />
        </label>
      </div>

      <div>
        <div className="font-black">Equipment der Outdoor-Variante</div>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          Nur das Material auswählen, das für die alternative Outdoor-Ausführung benötigt wird. Bei Outdoor-Planung ersetzt diese Liste die Studio-Equipmentliste der Übung und wird gegen den im Training Builder angegebenen Bestand geprüft.
        </p>
        <OutdoorEquipmentPicker
          disabled={disabled}
          options={data.equipment}
          selectedEquipment={data.selectedEquipment}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <p className="text-xs leading-5 text-[var(--muted)]">
          Der automatische Gym→Outdoor-Task kann diese Felder vorbefüllen; Traineränderungen bleiben erhalten, solange der Task nicht ausdrücklich mit Force erneut ausgeführt wird.
        </p>
        <button
          className={buttonClass("primary", "rounded-xl px-5 text-sm disabled:opacity-50")}
          disabled={disabled}
          type="submit"
        >
          Outdoor-Variante speichern
        </button>
      </div>
    </form>
  );
}
