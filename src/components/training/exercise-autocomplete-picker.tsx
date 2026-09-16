"use client";

import { useEffect, useRef, useState } from "react";

export interface SelectedExerciseReference {
  readonly id: string;
  readonly label: string;
  readonly category: string;
}

interface AutocompleteItem extends SelectedExerciseReference {
  readonly matchedAlias: string | null;
  readonly matchedContext: string | null;
}

interface ExerciseAutocompletePickerProps {
  readonly label: string;
  readonly description?: string;
  readonly selected: readonly SelectedExerciseReference[];
  readonly onChange: (items: readonly SelectedExerciseReference[]) => void;
  readonly placeholder?: string;
  readonly maxItems?: number;
}

export function ExerciseAutocompletePicker({
  label,
  description,
  selected,
  onChange,
  placeholder = "Übung oder Hindernis suchen …",
  maxItems = 8,
}: ExerciseAutocompletePickerProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<readonly AutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  function search(nextQuery: string) {
    setQuery(nextQuery);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);

    const trimmed = nextQuery.trim();
    if (trimmed.length < 2) {
      requestIdRef.current += 1;
      setItems([]);
      setLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);

    timerRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(trimmed)}&locale=de&limit=8`);
        if (!response.ok) throw new Error(`Autocomplete failed: ${response.status}`);
        const payload = (await response.json()) as { readonly items?: readonly AutocompleteItem[] };
        if (requestId !== requestIdRef.current) return;
        setItems(payload.items ?? []);
      } catch {
        if (requestId === requestIdRef.current) setItems([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 180);
  }

  function addItem(item: AutocompleteItem) {
    if (selected.some((entry) => entry.id === item.id) || selected.length >= maxItems) return;
    onChange([...selected, { id: item.id, label: item.label, category: item.category }]);
    setQuery("");
    setItems([]);
  }

  function removeItem(id: string) {
    onChange(selected.filter((item) => item.id !== id));
  }

  const isOpen = query.trim().length >= 2 && (loading || items.length > 0);

  return (
    <div>
      <label className="grid gap-2 text-sm font-bold">
        {label}
        {description ? <span className="font-normal leading-5 text-[var(--muted)]">{description}</span> : null}
        <div className="relative">
          <input
            aria-autocomplete="list"
            aria-expanded={isOpen}
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 pr-20 font-normal outline-none focus:border-[var(--focus)]"
            disabled={selected.length >= maxItems}
            onChange={(event) => search(event.target.value)}
            placeholder={selected.length >= maxItems ? `Maximal ${maxItems} ausgewählt` : placeholder}
            role="combobox"
            value={query}
          />
          {loading ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-[var(--muted)]">
              Suche …
            </span>
          ) : null}

          {isOpen ? (
            <div
              className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-card)]"
              role="listbox"
            >
              {items.map((item) => {
                const alreadySelected = selected.some((entry) => entry.id === item.id);
                const hint = item.matchedAlias ?? item.matchedContext;
                return (
                  <button
                    className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={alreadySelected}
                    key={item.id}
                    onClick={() => addItem(item)}
                    role="option"
                    type="button"
                  >
                    <span>
                      <span className="block text-sm font-black">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-[var(--muted)]">
                        {item.category}{hint ? ` · Treffer: ${hint}` : ""}
                      </span>
                    </span>
                    <span className="text-xs font-bold text-[var(--muted)]">{alreadySelected ? "Ausgewählt" : "+"}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </label>

      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 text-xs font-bold"
              key={item.id}
            >
              {item.label}
              <button
                aria-label={`${item.label} entfernen`}
                className="grid size-6 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                onClick={() => removeItem(item.id)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
