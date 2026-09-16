import { MuscleMap } from "@/components/body/muscle-map";
import type { ExerciseFacetEditorData } from "@/server/exercises/exercise-facet-repository";

interface ExerciseFacetFormProps {
  readonly action: (formData: FormData) => Promise<void>;
  readonly data: ExerciseFacetEditorData;
  readonly disabled?: boolean;
}

export function ExerciseFacetForm({ action, data, disabled = false }: ExerciseFacetFormProps) {
  const movementSelection = new Set(data.selected.movementPatternIds);
  const tagSelection = new Set(data.selected.tagIds);
  const equipmentSelection = new Map(data.selected.equipment.map((item) => [item.id, item.quantityRequired]));

  return (
    <form action={action} className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <MuscleMap
          description="Klicke eine Muskelgruppe: Primär → Sekundär → Aus. Die Auswahl wird direkt als Körperregion der Übung gespeichert."
          disabled={disabled}
          emphasisFieldPrefix="bodyEmphasis:"
          fieldName="bodyRegionIds"
          mode="emphasis"
          options={data.bodyRegions}
          visualCompact
          title="Muskel- & Körperregionen"
          value={data.selected.bodyRegions}
        />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <SectionHeader
          title="Bewegungsmuster"
          text="Diese Facetten verbessern Suche, Trainingszusammenstellung und spätere Variantenlogik."
        />
        <CheckboxGrid
          disabled={disabled}
          name="movementPatternIds"
          options={data.movementPatterns}
          selected={movementSelection}
        />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <SectionHeader
          title="Tags & Trainingsziele"
          text="Mehrfachauswahl für OCR-Bezug, Trainingsziel und typische Einsatzkontexte."
        />
        <CheckboxGrid
          disabled={disabled}
          name="tagIds"
          options={data.tags}
          selected={tagSelection}
        />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <SectionHeader
          title="Equipment"
          text="Nur benötigtes Material auswählen; die Menge beschreibt den Bedarf pro Station bzw. Übungsaufbau."
        />
        <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {data.equipment.map((option) => {
            const quantity = equipmentSelection.get(option.id);
            return (
              <div className="grid grid-cols-[auto_minmax(0,1fr)_92px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3" key={option.id}>
                <input
                  aria-label={`${option.labelDe} auswählen`}
                  defaultChecked={quantity !== undefined}
                  disabled={disabled}
                  name="equipmentIds"
                  type="checkbox"
                  value={option.id}
                />
                <div className="min-w-0">
                  <FacetLabel de={option.labelDe} en={option.labelEn} />
                  {option.quantityAvailable !== null ? (
                    <div className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">
                      Vereinsbestand: {option.quantityAvailable}
                    </div>
                  ) : null}
                </div>
                <label className="grid gap-1 text-[11px] font-bold text-[var(--muted)]">
                  Menge
                  <input
                    className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--foreground)]"
                    defaultValue={quantity ?? 1}
                    disabled={disabled}
                    max={99}
                    min={1}
                    name={`equipmentQty:${option.id}`}
                    type="number"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Änderungen aktualisieren die DE/EN-Suchdokumente und markieren den FTS-Index zur Neuerstellung.
        </p>
        <button
          className="min-h-11 shrink-0 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          type="submit"
        >
          Facetten speichern
        </button>
      </div>
    </form>
  );
}

function CheckboxGrid({
  disabled,
  name,
  options,
  selected,
}: {
  readonly disabled: boolean;
  readonly name: string;
  readonly options: ExerciseFacetEditorData["tags"];
  readonly selected: ReadonlySet<string>;
}) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {options.map((option) => (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3" key={option.id}>
          <input
            className="mt-0.5"
            defaultChecked={selected.has(option.id)}
            disabled={disabled}
            name={name}
            type="checkbox"
            value={option.id}
          />
          <FacetLabel de={option.labelDe} en={option.labelEn} />
        </label>
      ))}
    </div>
  );
}

function FacetLabel({ de, en }: { readonly de: string; readonly en: string }) {
  return (
    <span className="min-w-0">
      <span className="block truncate text-sm font-bold text-[var(--foreground)]">{de}</span>
      {en !== de ? <span className="block truncate text-[11px] text-[var(--muted)]">{en}</span> : null}
    </span>
  );
}

function SectionHeader({ title, text }: { readonly title: string; readonly text: string }) {
  return (
    <div>
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </div>
  );
}
