"use client";

import { useMemo, useRef, useState, type MouseEvent } from "react";
import {
  MUSCLE_MAP_PARTS,
  MUSCLE_MAP_PARTS_BY_OPTION,
  MUSCLE_MAP_REFERENCE_SIZE,
  type MuscleMapPart,
} from "@/data/muscle-map-regions";
import { RasterMuscleLayer, type RasterMuscleTone } from "./raster-muscle-layer";
import { scaledCoords, useResponsiveImageMap } from "./use-responsive-image-map";

export type MuscleEmphasis = "primary" | "secondary";

export interface MuscleMapOption {
  readonly id: string;
  readonly labelDe: string;
  readonly labelEn?: string;
}

export interface MuscleMapValue {
  readonly id: string;
  readonly emphasis?: MuscleEmphasis;
}

interface MuscleMapProps {
  readonly options: readonly MuscleMapOption[];
  readonly value?: readonly MuscleMapValue[];
  readonly onChange?: (value: readonly MuscleMapValue[]) => void;
  readonly mode?: "select" | "emphasis" | "display";
  readonly fieldName?: string;
  readonly emphasisFieldPrefix?: string;
  readonly disabled?: boolean;
  readonly compact?: boolean;
  readonly title?: string;
  readonly description?: string;
  readonly debug?: boolean;
}

const UPPER_IDS = new Set([
  "neck", "traps", "shoulders", "rear-delts", "chest", "upper-back", "lats",
  "upper-arms", "biceps", "triceps", "forearms-grip",
]);
const CORE_IDS = new Set(["core", "abs", "obliques", "lower-back", "hips"]);
const CATEGORY_ORDER = ["Gesamt", "Oberkörper", "Core", "Unterkörper"] as const;

const FALLBACK_OPTION_PARTS: Readonly<Record<string, readonly string[]>> = {
  "upper-arms": ["biceps", "triceps"],
  core: ["abs", "obliques"],
  shoulders: ["rear-delts"],
  "upper-back": ["traps", "lats"],
};

function categoryForOption(id: string) {
  if (UPPER_IDS.has(id)) return "Oberkörper";
  if (CORE_IDS.has(id)) return "Core";
  if (id === "full-body") return "Gesamt";
  return "Unterkörper";
}

function toneFor(mode: MuscleMapProps["mode"], value?: MuscleMapValue): RasterMuscleTone {
  if (!value) return "selected";
  if (mode === "emphasis") return value.emphasis === "secondary" ? "secondary" : "primary";
  return "selected";
}

function optionParts(optionId: string): readonly MuscleMapPart[] {
  const direct = MUSCLE_MAP_PARTS_BY_OPTION.get(optionId);
  if (direct?.length) return direct;
  const fallbackIds = FALLBACK_OPTION_PARTS[optionId] ?? [];
  return fallbackIds.flatMap((id) => MUSCLE_MAP_PARTS_BY_OPTION.get(id) ?? []);
}

export function MuscleMap({
  options,
  value = [],
  onChange,
  mode = "select",
  fieldName = "muscle",
  emphasisFieldPrefix = "muscleEmphasis:",
  disabled = false,
  compact = false,
  title = "Muskelgruppen",
  description,
  debug = false,
}: MuscleMapProps) {
  const [internalSelection, setInternalSelection] = useState<MuscleMapValue[]>(() => [...value]);
  const [hoveredPart, setHoveredPart] = useState<MuscleMapPart | null>(null);
  const [debugPoints, setDebugPoints] = useState<readonly [number, number][]>([]);
  const [listOpen, setListOpen] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set(CATEGORY_ORDER));
  const imageRef = useRef<HTMLImageElement>(null);
  const { scaleX, scaleY } = useResponsiveImageMap(imageRef);

  const selection = onChange ? value : internalSelection;
  const interactive = mode !== "display" && !disabled;
  const optionById = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  const selectedById = useMemo(() => new Map(selection.map((item) => [item.id, item])), [selection]);
  const optionIds = useMemo(() => new Set(options.map((option) => option.id)), [options]);

  const visibleParts = useMemo(
    () => MUSCLE_MAP_PARTS.filter(
      (part) => optionIds.has(part.optionId)
        || [...optionIds].some((optionId) => FALLBACK_OPTION_PARTS[optionId]?.includes(part.optionId)),
    ),
    [optionIds],
  );

  const groupedOptions = useMemo(() => {
    const result = new Map<string, MuscleMapOption[]>();
    for (const option of options) {
      const category = categoryForOption(option.id);
      const bucket = result.get(category) ?? [];
      bucket.push(option);
      result.set(category, bucket);
    }
    return CATEGORY_ORDER.flatMap((category) => {
      const entries = result.get(category);
      return entries?.length ? [[category, entries] as const] : [];
    });
  }, [options]);

  function setSelection(next: readonly MuscleMapValue[]) {
    if (onChange) onChange(next);
    else setInternalSelection([...next]);
  }

  function cycle(id: string) {
    if (!interactive) return;
    const existing = selection.find((item) => item.id === id);
    if (mode === "select") {
      setSelection(existing ? selection.filter((item) => item.id !== id) : [...selection, { id }]);
      return;
    }
    if (!existing) {
      setSelection([...selection, { id, emphasis: "primary" }]);
      return;
    }
    if ((existing.emphasis ?? "primary") === "primary") {
      setSelection(selection.map((item) => item.id === id ? { ...item, emphasis: "secondary" } : item));
      return;
    }
    setSelection(selection.filter((item) => item.id !== id));
  }

  function setChecked(id: string, checked: boolean) {
    if (!interactive) return;
    const existing = selectedById.get(id);
    if (!checked) {
      if (existing) setSelection(selection.filter((item) => item.id !== id));
      return;
    }
    if (existing) return;
    setSelection(mode === "emphasis"
      ? [...selection, { id, emphasis: "primary" }]
      : [...selection, { id }]);
  }

  function setEmphasis(id: string, emphasis: MuscleEmphasis) {
    if (!interactive || mode !== "emphasis") return;
    const existing = selectedById.get(id);
    if (!existing) {
      setSelection([...selection, { id, emphasis }]);
      return;
    }
    setSelection(selection.map((item) => item.id === id ? { ...item, emphasis } : item));
  }

  function setCategoryOpen(category: string, open: boolean) {
    setOpenCategories((current) => {
      const next = new Set(current);
      if (open) next.add(category);
      else next.delete(category);
      return next;
    });
  }

  function optionForPart(part: MuscleMapPart): string | null {
    if (optionIds.has(part.optionId)) return part.optionId;
    for (const optionId of optionIds) {
      if (FALLBACK_OPTION_PARTS[optionId]?.includes(part.optionId)) return optionId;
    }
    return null;
  }

  function addDebugPoint(event: MouseEvent<HTMLDivElement>) {
    if (!debug) return;
    const image = imageRef.current;
    if (!image) return;
    const rect = image.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / Math.max(scaleX, 0.0001));
    const y = Math.round((event.clientY - rect.top) / Math.max(scaleY, 0.0001));
    if (x < 0 || y < 0 || x > MUSCLE_MAP_REFERENCE_SIZE.width || y > MUSCLE_MAP_REFERENCE_SIZE.height) return;
    setDebugPoints((points) => [...points, [x, y]]);
  }

  const fullBody = selectedById.get("full-body");
  const debugCoordinates = debugPoints.flatMap(([x, y]) => [x, y]).join(", ");

  return (
    <div className={compact ? "space-y-2" : "w-full space-y-4"}>
      {!compact ? (
        <div>
          <h3 className="font-black text-[var(--foreground)]">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
        </div>
      ) : null}

      <div className={compact ? "mx-auto w-full max-w-56" : "w-full"}>
        <div className={compact ? "w-full" : "mx-auto w-full max-w-3xl"}>
          <div
            className="relative mx-auto overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-card)]"
            onClick={addDebugPoint}
          >
            {/* Raster anatomy only: no SVG source and no vector highlight drawing. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Detaillierte anatomische Vorder- und Rückansicht zur Auswahl von Muskelgruppen"
              className="block h-auto w-full select-none"
              draggable={false}
              height={MUSCLE_MAP_REFERENCE_SIZE.height}
              ref={imageRef}
              src="/assets/muscle-map-base.webp"
              useMap={interactive && !debug ? "#ocrcraft-muscle-map" : undefined}
              width={MUSCLE_MAP_REFERENCE_SIZE.width}
            />

            {fullBody ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
                draggable={false}
                src="/assets/muscle-map-base.webp"
                style={{
                  filter: fullBody.emphasis === "secondary"
                    ? "grayscale(1) sepia(1) saturate(9) hue-rotate(168deg)"
                    : "grayscale(1) sepia(1) saturate(9) hue-rotate(320deg)",
                  mixBlendMode: "multiply",
                  opacity: 0.24,
                }}
              />
            ) : null}

            {selection.flatMap((item) => optionParts(item.id).map((part) => (
              <RasterMuscleLayer key={`${item.id}-${part.id}`} part={part} tone={toneFor(mode, item)} />
            )))}

            {hoveredPart && !debug ? <RasterMuscleLayer part={hoveredPart} tone="hover" /> : null}
            {debug ? visibleParts.map((part) => <RasterMuscleLayer key={`debug-${part.id}`} part={part} subtle tone="selected" />) : null}

            {debugPoints.map(([x, y], index) => (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--focus)] ring-2 ring-white"
                key={`${x}-${y}-${index}`}
                style={{ left: x * scaleX, top: y * scaleY }}
              />
            ))}
          </div>

          {!compact ? (
            <div className="mt-2 grid grid-cols-2 text-center text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
              <span>Vorderseite</span>
              <span>Rückseite</span>
            </div>
          ) : null}

          {hoveredPart && !compact ? (
            <div className="mt-2 text-center text-xs font-bold text-[var(--muted)]">{hoveredPart.labelDe}</div>
          ) : null}
        </div>

        {!compact ? (
          <details
            className="mt-5 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] shadow-[var(--shadow-card)]"
            onToggle={(event) => setListOpen(event.currentTarget.open)}
            open={listOpen}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:hidden sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-[var(--foreground)]">Muskelgruppen</span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]">
                    {selection.length} ausgewählt
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Volle Breite, responsive Spalten und einzeln einklappbare Bereiche. Karte und Checkboxen teilen denselben Zustand.
                </p>
              </div>
              <span aria-hidden="true" className="shrink-0 text-lg font-black text-[var(--muted)]">{listOpen ? "−" : "+"}</span>
            </summary>

            <div className="border-t border-[var(--border)] p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent-soft)]"
                    onClick={() => setOpenCategories(new Set(groupedOptions.map(([category]) => category)))}
                    type="button"
                  >
                    Alle öffnen
                  </button>
                  <button
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--accent-soft)]"
                    onClick={() => setOpenCategories(new Set())}
                    type="button"
                  >
                    Alle schließen
                  </button>
                </div>
                {interactive && selection.length > 0 ? (
                  <button
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)]"
                    onClick={() => setSelection([])}
                    type="button"
                  >
                    Auswahl löschen
                  </button>
                ) : null}
              </div>

              <div className="grid w-full gap-3">
                {groupedOptions.map(([category, entries]) => {
                  const selectedCount = entries.filter((entry) => selectedById.has(entry.id)).length;
                  const categoryOpen = openCategories.has(category);
                  return (
                    <details
                      className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
                      key={category}
                      onToggle={(event) => setCategoryOpen(category, event.currentTarget.open)}
                      open={categoryOpen}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 marker:hidden sm:px-4">
                        <span className="font-black text-[var(--foreground)]">{category}</span>
                        <span className="flex items-center gap-2">
                          {selectedCount > 0 ? (
                            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-black text-[var(--foreground)]">{selectedCount}</span>
                          ) : null}
                          <span aria-hidden="true" className="font-black text-[var(--muted)]">{categoryOpen ? "−" : "+"}</span>
                        </span>
                      </summary>

                      <div className="border-t border-[var(--border)] p-3 sm:p-4">
                        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2">
                          {entries.map((option) => {
                            const selected = selectedById.get(option.id);
                            const secondary = selected?.emphasis === "secondary";
                            return (
                              <div
                                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 transition ${selected ? "border-[var(--border-strong)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface-subtle)]"}`}
                                key={option.id}
                              >
                                <label className={`flex min-w-0 flex-1 items-center gap-2 ${interactive ? "cursor-pointer" : "cursor-default"}`}>
                                  <input
                                    aria-label={option.labelDe}
                                    checked={Boolean(selected)}
                                    className="size-4 shrink-0 accent-[var(--accent-strong)]"
                                    disabled={!interactive}
                                    onChange={(event) => setChecked(option.id, event.currentTarget.checked)}
                                    type="checkbox"
                                  />
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-bold text-[var(--foreground)]">{option.labelDe}</span>
                                    {option.labelEn && option.labelEn !== option.labelDe ? (
                                      <span className="block truncate text-[11px] text-[var(--muted)]">{option.labelEn}</span>
                                    ) : null}
                                  </span>
                                </label>

                                {mode === "emphasis" && selected ? (
                                  <span className="grid shrink-0 grid-cols-2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
                                    <button
                                      aria-label={`${option.labelDe} als Primärmuskel markieren`}
                                      aria-pressed={!secondary}
                                      className={`rounded-md px-2 py-1 text-[10px] font-black ${!secondary ? "bg-red-500 text-white" : "text-[var(--muted)]"}`}
                                      disabled={!interactive}
                                      onClick={() => setEmphasis(option.id, "primary")}
                                      type="button"
                                    >
                                      P
                                    </button>
                                    <button
                                      aria-label={`${option.labelDe} als Sekundärmuskel markieren`}
                                      aria-pressed={secondary}
                                      className={`rounded-md px-2 py-1 text-[10px] font-black ${secondary ? "bg-blue-500 text-white" : "text-[var(--muted)]"}`}
                                      disabled={!interactive}
                                      onClick={() => setEmphasis(option.id, "secondary")}
                                      type="button"
                                    >
                                      S
                                    </button>
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          </details>
        ) : null}
      </div>

      {interactive && !debug ? (
        <map name="ocrcraft-muscle-map">
          {visibleParts.map((part) => {
            const optionId = optionForPart(part);
            if (!optionId) return null;
            return (
              <area
                alt={part.labelDe}
                aria-label={part.labelDe}
                coords={scaledCoords(part.coordinates, scaleX, scaleY)}
                href="#"
                key={part.id}
                onClick={(event) => {
                  event.preventDefault();
                  cycle(optionId);
                }}
                onMouseEnter={() => setHoveredPart(part)}
                onMouseLeave={() => setHoveredPart(null)}
                shape="poly"
                title={part.labelDe}
              />
            );
          })}
        </map>
      ) : null}

      {mode === "emphasis" ? (
        <div className="flex flex-wrap gap-3 text-xs font-bold text-[var(--muted)]">
          <Legend color="#ef4444" label="Primär" />
          <Legend color="#3b82f6" label="Sekundär" />
          {interactive ? <span>Karte: Primär → Sekundär → Aus · Liste: Checkbox + P/S</span> : null}
        </div>
      ) : null}

      {!compact && selection.length > 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Ausgewählte Muskeln</div>
          <div className="flex flex-wrap gap-2">
            {selection.map((item) => {
              const option = optionById.get(item.id);
              if (!option) return null;
              const secondary = item.emphasis === "secondary";
              return (
                <button
                  className="rounded-full border px-3 py-1.5 text-xs font-bold text-[var(--foreground)]"
                  disabled={!interactive}
                  key={item.id}
                  onClick={() => cycle(item.id)}
                  style={{
                    background: mode === "select" ? "var(--accent-soft)" : secondary ? "#eff6ff" : "#fef2f2",
                    borderColor: mode === "select" ? "var(--accent-strong)" : secondary ? "#93c5fd" : "#fca5a5",
                  }}
                  type="button"
                >
                  {option.labelDe}{interactive ? " ×" : ""}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {debug ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-xs">
          <div className="font-black">Koordinaten-Debug</div>
          <div className="mt-1 font-mono text-[var(--muted)]">Letzter Punkt: {debugPoints.at(-1)?.join(" / ") ?? "–"}</div>
          <textarea className="mt-2 min-h-20 w-full rounded-lg border border-[var(--border)] p-2 font-mono" readOnly value={`coordinates: [${debugCoordinates}]`} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-bold" onClick={() => setDebugPoints((points) => points.slice(0, -1))} type="button">Undo Point</button>
            <button className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-bold" onClick={() => setDebugPoints([])} type="button">Clear</button>
            <button className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-bold" onClick={() => void navigator.clipboard.writeText(`[${debugCoordinates}]`)} type="button">Copy Coordinates</button>
          </div>
        </div>
      ) : null}

      {mode !== "display" ? selection.map((item) => (
        <span key={`fields-${item.id}`}>
          <input name={fieldName} type="hidden" value={item.id} />
          {mode === "emphasis" ? <input name={`${emphasisFieldPrefix}${item.id}`} type="hidden" value={item.emphasis ?? "primary"} /> : null}
        </span>
      )) : null}
    </div>
  );
}

function Legend({ color, label }: { readonly color: string; readonly label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: color }} />{label}</span>;
}
