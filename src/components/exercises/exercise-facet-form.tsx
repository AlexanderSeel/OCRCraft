"use client";

import { useMemo, useState } from "react";
import { MuscleMap, type MuscleMapValue } from "@/components/body/muscle-map";
import { getBodyRegionAntagonists } from "@/domain/body-regions";
import { Disclosure } from "@/components/ui/disclosure";
import type { ExerciseFacetEditorData } from "@/server/exercises/exercise-facet-repository";

interface ExerciseFacetFormProps {
  readonly action: (formData: FormData) => Promise<void>;
  readonly data: ExerciseFacetEditorData;
  readonly disabled?: boolean;
}

function oppositionKey(primaryRegionId: string, opposingRegionId: string) {
  return `${primaryRegionId}\u0000${opposingRegionId}`;
}

export function ExerciseFacetForm({ action, data, disabled = false }: ExerciseFacetFormProps) {
  const [bodyRegions, setBodyRegions] = useState<readonly MuscleMapValue[]>(data.selected.bodyRegions);
  const [oppositionKeys, setOppositionKeys] = useState<ReadonlySet<string>>(
    () => new Set(data.selected.muscleOppositions.map((item) => oppositionKey(item.primaryRegionId, item.opposingRegionId))),
  );
  const movementSelection = new Set(data.selected.movementPatternIds);
  const tagSelection = new Set(data.selected.tagIds);
  const equipmentSelection = new Map(data.selected.equipment.map((item) => [item.id, item.quantityRequired]));
  const bodyOptionById = useMemo(() => new Map(data.bodyRegions.map((option) => [option.id, option])), [data.bodyRegions]);
  const persistedByPrimary = useMemo(() => {
    const result = new Map<string, string[]>();
    for (const item of data.selected.muscleOppositions) {
      const values = result.get(item.primaryRegionId) ?? [];
      values.push(item.opposingRegionId);
      result.set(item.primaryRegionId, values);
    }
    return result;
  }, [data.selected.muscleOppositions]);
  const primaryRegions = bodyRegions.filter((item) => (item.emphasis ?? "primary") === "primary");

  function setOpposition(primaryRegionId: string, opposingRegionId: string, checked: boolean) {
    setOppositionKeys((current) => {
      const next = new Set(current);
      const key = oppositionKey(primaryRegionId, opposingRegionId);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function selectTypicalOppositions(primaryRegionId: string) {
    setOppositionKeys((current) => {
      const next = new Set(current);
      for (const opposingRegionId of getBodyRegionAntagonists(primaryRegionId)) {
        next.add(oppositionKey(primaryRegionId, opposingRegionId));
      }
      return next;
    });
  }

  return (
    <form action={action} className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <MuscleMap
          description="Klicke eine Muskelgruppe: Primär → Sekundär → Aus. Gegenmuskeln können auf der Karte eingeblendet und darunter separat als Antagonisten gespeichert werden."
          disabled={disabled}
          emphasisFieldPrefix="bodyEmphasis:"
          fieldName="bodyRegionIds"
          mode="emphasis"
          onChange={setBodyRegions}
          options={data.bodyRegions}
          visualCompact
          title="Muskel- & Körperregionen"
          value={bodyRegions}
        />

        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-black">Gegenmuskeln / Antagonisten</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Diese Zuordnung wird getrennt von Sekundärmuskeln gespeichert. Wähle pro Primärmuskel nur echte Gegenbewegungs-/Antagonistenbeziehungen aus.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-black text-[var(--muted)]">
              {primaryRegions.length} Primärmuskel{primaryRegions.length === 1 ? "" : "n"}
            </span>
          </div>

          {primaryRegions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
              Markiere oben mindestens einen Primärmuskel. Danach erscheinen hier passende Gegenmuskeln mit eigener Checkbox.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {primaryRegions.map((primary) => {
                const recommended = getBodyRegionAntagonists(primary.id);
                const persisted = persistedByPrimary.get(primary.id) ?? [];
                const candidates = [...new Set([...recommended, ...persisted])];
                const primaryLabel = bodyOptionById.get(primary.id)?.labelDe ?? primary.id;
                return (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" key={primary.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--muted)]">Primär</div>
                        <div className="font-black">{primaryLabel}</div>
                      </div>
                      {recommended.length ? (
                        <button
                          className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-black hover:bg-[var(--accent-soft)] disabled:opacity-40"
                          disabled={disabled}
                          onClick={() => selectTypicalOppositions(primary.id)}
                          type="button"
                        >
                          Typische übernehmen
                        </button>
                      ) : null}
                    </div>
                    {candidates.length ? (
                      <div className="mt-3 grid gap-2">
                        {candidates.map((opposingRegionId) => {
                          const option = bodyOptionById.get(opposingRegionId);
                          const key = oppositionKey(primary.id, opposingRegionId);
                          const isRecommended = recommended.includes(opposingRegionId as never);
                          return (
                            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2" key={key}>
                              <input
                                checked={oppositionKeys.has(key)}
                                disabled={disabled}
                                name="muscleOpposition"
                                onChange={(event) => setOpposition(primary.id, opposingRegionId, event.currentTarget.checked)}
                                type="checkbox"
                                value={JSON.stringify({ primaryRegionId: primary.id, opposingRegionId })}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold">{option?.labelDe ?? opposingRegionId}</span>
                                {option?.labelEn && option.labelEn !== option.labelDe ? (
                                  <span className="block text-[11px] text-[var(--muted)]">{option.labelEn}</span>
                                ) : null}
                              </span>
                              {isRecommended ? (
                                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700 dark:bg-violet-950/50 dark:text-violet-200">typisch</span>
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[var(--muted)]">Für diesen Bereich ist keine konservative Standard-Antagonistenbeziehung hinterlegt.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Disclosure className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" summaryClassName="min-h-8 items-center font-bold" summary="Bewegungsmuster">
        <div className="mt-2">
          <CheckboxGrid
            disabled={disabled}
            name="movementPatternIds"
            options={data.movementPatterns}
            selected={movementSelection}
          />
        </div>
      </Disclosure>

      <Disclosure className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" summaryClassName="min-h-8 items-center font-bold" summary="Tags & Trainingsziele">
        <div className="mt-2">
          <CheckboxGrid
            disabled={disabled}
            name="tagIds"
            options={data.tags}
            selected={tagSelection}
          />
        </div>
      </Disclosure>

      <Disclosure className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" summaryClassName="min-h-8 items-center font-bold" summary="Equipment">
        <div className="mt-2">
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
        </div>
      </Disclosure>

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
