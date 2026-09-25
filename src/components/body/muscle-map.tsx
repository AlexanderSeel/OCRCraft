"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import {
  COARSE_BODY_REGION_IDS,
  DETAIL_BODY_REGION_OPTIONS,
  getBodyRegionAntagonists,
  bodyRegionParent,
  detailBodyRegion,
} from "@/domain/body-regions";
import {
  MUSCLE_MAP_PARTS,
  MUSCLE_MAP_PARTS_BY_OPTION,
  MUSCLE_MAP_REFERENCE_SIZE,
  type MuscleMapPart,
} from "@/data/muscle-map-regions";
import {
  clientPointToMuscleMapPoint,
  findMuscleMapPartAtPoint,
} from "./muscle-map-hit-test";
import { RasterMuscleLayer, type RasterMuscleTone } from "./raster-muscle-layer";
import { useResponsiveImageMap } from "./use-responsive-image-map";

export type MuscleEmphasis = "primary" | "secondary";
export const MUSCLE_MAP_DEBUG_STORAGE_KEY = "ocrcraft-muscle-map-debug";
const muscleDebugEvent = "ocrcraft-muscle-map-debug-change";
function subscribeDebug(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(muscleDebugEvent, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(muscleDebugEvent, callback); };
}
function readDebugSetting() {
  try { return window.localStorage.getItem(MUSCLE_MAP_DEBUG_STORAGE_KEY) === "true"; } catch { return false; }
}

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
  /** Limits only the raster view; the accessible selection list remains visible. */
  readonly visualCompact?: boolean;
  readonly title?: string;
  readonly description?: string;
  readonly debug?: boolean;
}

const UPPER_IDS = new Set([
  "neck", "traps", "shoulders", "rear-delts", "chest", "upper-back", "lats",
  "upper-arms", "biceps", "triceps", "forearms-grip",
]);
const CORE_IDS = new Set(["core", "abs", "obliques", "serratus", "lower-back", "hips"]);
const CATEGORY_ORDER = ["Gesamt", "Oberkörper", "Core", "Unterkörper"] as const;

const FALLBACK_OPTION_PARTS: Readonly<Record<string, readonly string[]>> = {
  "upper-arms": ["biceps", "triceps"],
  core: ["abs", "obliques", "serratus"],
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
  if (optionId === "full-body") return MUSCLE_MAP_PARTS;

  const direct = MUSCLE_MAP_PARTS_BY_OPTION.get(optionId) ?? [];
  if (detailBodyRegion(optionId)) return direct;
  const parentIds = new Set([optionId, ...(FALLBACK_OPTION_PARTS[optionId] ?? [])]);
  return MUSCLE_MAP_PARTS.filter(part => parentIds.has(bodyRegionParent(part.optionId)));
}

function optionForPart(part: MuscleMapPart, optionIds: ReadonlySet<string>, detailed = true): string | null {
  if (detailed && optionIds.has(part.optionId)) return part.optionId;
  const parent = bodyRegionParent(part.optionId);
  if (optionIds.has(parent)) return parent;
  for (const optionId of optionIds) {
    if (FALLBACK_OPTION_PARTS[optionId]?.includes(bodyRegionParent(part.optionId))) return optionId;
  }
  return null;
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
  visualCompact = false,
  title = "Muskelgruppen",
  description,
  debug = false,
}: MuscleMapProps) {
  const configuredDebug = useSyncExternalStore(subscribeDebug, readDebugSetting, () => false);
  const showDebug = debug || configuredDebug;
  const [internalSelection, setInternalSelection] = useState<MuscleMapValue[]>(() => [...value]);
  const [hoveredPart, setHoveredPart] = useState<MuscleMapPart | null>(null);
  const [debugPoints, setDebugPoints] = useState<readonly [number, number][]>([]);
  const [debugLastHit, setDebugLastHit] = useState<string | null>(null);
  const [detailed, setDetailed] = useState(true);
  const [regionSearch, setRegionSearch] = useState("");
  const [listOpen, setListOpen] = useState(true);
  const [showAntagonists, setShowAntagonists] = useState(false);
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
      (part) => optionIds.has(part.optionId) || optionIds.has(bodyRegionParent(part.optionId))
        || [...optionIds].some((optionId) => FALLBACK_OPTION_PARTS[optionId]?.includes(bodyRegionParent(part.optionId))),
    ),
    [optionIds],
  );

  const groupedOptions = useMemo(() => {
    const result = new Map<string, MuscleMapOption[]>();
    const query = regionSearch.trim().toLocaleLowerCase("de");
    for (const option of options) {
      const detail = detailBodyRegion(option.id);
      if (detail && !detailed) continue;
      const parentId = bodyRegionParent(option.id);
      const parentLabel = options.find(o => o.id === parentId)?.labelDe ?? parentId;
      if (query && !`${option.labelDe} ${option.labelEn ?? ""} ${parentLabel}`.toLocaleLowerCase("de").includes(query)) continue;
      const category = detailed
        ? parentLabel
        : categoryForOption(option.id);
      const bucket = result.get(category) ?? [];
      bucket.push(option);
      result.set(category, bucket);
    }
    return (detailed ? [...result.keys()] : CATEGORY_ORDER).flatMap((category) => {
      const entries = result.get(category);
      return entries?.length ? [[category, entries] as const] : [];
    });
  }, [options, detailed, regionSearch]);

  const hoveredOptionId = hoveredPart ? optionForPart(hoveredPart, optionIds, detailed) : null;
  const antagonistIds = useMemo(() => {
    if (!showAntagonists) return [] as string[];

    const result = new Set<string>();
    const sources = new Set(selection.map((item) => item.id));
    if (hoveredOptionId) sources.add(hoveredOptionId);

    for (const source of sources) {
      for (const antagonist of getBodyRegionAntagonists(source)) {
        if (optionIds.has(antagonist) && !selectedById.has(antagonist)) result.add(antagonist);
      }
    }
    return [...result];
  }, [hoveredOptionId, optionIds, selectedById, selection, showAntagonists]);

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

  function addAntagonistsToSelection() {
    if (!interactive || mode !== "select" || antagonistIds.length === 0) return;
    setSelection([
      ...selection,
      ...antagonistIds.map((id) => ({ id })),
    ]);
  }

  function setCategoryOpen(category: string, open: boolean) {
    setOpenCategories((current) => {
      const next = new Set(current);
      if (open) next.add(category);
      else next.delete(category);
      return next;
    });
  }

  function referencePoint(event: MouseEvent<HTMLDivElement>) {
    const image = imageRef.current;
    if (!image) return null;
    const rect = image.getBoundingClientRect();
    return clientPointToMuscleMapPoint(
      event.clientX,
      event.clientY,
      rect,
      MUSCLE_MAP_REFERENCE_SIZE.width,
      MUSCLE_MAP_REFERENCE_SIZE.height,
    );
  }

  function hitPart(event: MouseEvent<HTMLDivElement>): MuscleMapPart | null {
    const point = referencePoint(event);
    return point ? findMuscleMapPartAtPoint(visibleParts, point) : null;
  }

  function handleMapMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!interactive) return;
    setHoveredPart(hitPart(event));
  }

  function handleMapClick(event: MouseEvent<HTMLDivElement>) {
    if (showDebug) {
      const point = referencePoint(event);
      if (point) setDebugPoints((points) => [...points, [Math.round(point.x), Math.round(point.y)]]);
    }
    if (!interactive) return;
    const part = hitPart(event);
    if (!part) {
      if (showDebug) setDebugLastHit(null);
      return;
    }
    if (showDebug) setDebugLastHit(part.labelDe);
    const optionId = optionForPart(part, optionIds, detailed);
    if (optionId) cycle(optionId);
  }

  const debugCoordinates = debugPoints.flatMap(([x, y]) => [x, y]).join(", ");

  return (
    <div className={compact ? "muscle-map-component space-y-2" : "muscle-map-component w-full space-y-3"}>
      {!compact ? (
        <div>
          <h3 className="font-black text-[var(--foreground)]">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
        </div>
      ) : null}

      {!compact && interactive ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-pressed={!detailed} onClick={() => setDetailed(false)} className="min-h-11 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold">{COARSE_BODY_REGION_IDS.length} Hauptbereiche</button>
          <button type="button" aria-pressed={detailed} onClick={() => setDetailed(true)} className="min-h-11 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold">{DETAIL_BODY_REGION_OPTIONS.length} Detailbereiche</button>
          <span className="text-xs text-[var(--muted)]">{detailed ? "Detailauswahl · links/rechts aus Sicht der dargestellten Person" : "Auswahl ganzer Muskelgruppen"}</span>
        </div>
      ) : null}
      <div className={compact && mode !== "display" ? "muscle-workspace grid items-start gap-3" : compact ? "mx-auto w-full max-w-56" : "muscle-workspace grid items-start gap-4"}>
        <div className={compact ? "muscle-figure mx-auto w-full max-w-[220px]" : visualCompact ? "muscle-figure mx-auto w-full max-w-[300px]" : "muscle-figure mx-auto w-full max-w-[360px]"}>
          <div
            className={`relative mx-auto aspect-[376/504] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muscle-canvas)] shadow-[var(--shadow-card)] ${interactive ? "cursor-pointer" : ""}`}
            onClick={handleMapClick}
            onMouseLeave={() => setHoveredPart(null)}
            onMouseMove={handleMapMouseMove}
          >
            {/* Raster anatomy only: pointer hit-testing uses the same reference box as the image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Detaillierte anatomische Vorder- und Rückansicht zur Auswahl von Muskelgruppen"
              className="absolute inset-0 block h-full w-full select-none object-fill"
              draggable={false}
              height={MUSCLE_MAP_REFERENCE_SIZE.height}
              ref={imageRef}
              src="/assets/muscle-map-base.webp"
              width={MUSCLE_MAP_REFERENCE_SIZE.width}
            />

            {showAntagonists ? antagonistIds.flatMap((id) => optionParts(id).map((part) => (
              <RasterMuscleLayer key={`antagonist-${id}-${part.id}`} part={part} tone="antagonist" />
            ))) : null}

            {selection.flatMap((item) => optionParts(item.id).map((part) => (
              <RasterMuscleLayer key={`${item.id}-${part.id}`} part={part} tone={toneFor(mode, item)} />
            )))}

            {showDebug ? visibleParts.map((part) => <RasterMuscleLayer key={`debug-${part.id}`} part={part} subtle tone="selected" />) : null}
            {hoveredPart ? <RasterMuscleLayer part={hoveredPart} tone="hover" /> : null}

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
            <div className="mt-2 text-center text-xs font-bold text-[var(--muted)]">
              {hoveredPart.labelDe}{hoveredOptionId ? ` · ${optionById.get(hoveredOptionId)?.labelDe ?? hoveredOptionId}` : ""}
            </div>
          ) : null}
        </div>

        {mode !== "display" ? (
          <details
            className="muscle-tree min-w-0 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] shadow-[var(--shadow-card)]"
            onToggle={(event) => setListOpen(event.currentTarget.open)}
            open={listOpen}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-3 py-2 marker:hidden">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-[var(--foreground)]">Muskelgruppen</span>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]">
                    {selection.length} ausgewählt
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Hauptbereiche umfassen mehrere Details. Einzelne Details werden mit Seite und Ansicht gespeichert.
                </p>
              </div>
              <span aria-hidden="true" className="shrink-0 text-lg font-black text-[var(--muted)]">{listOpen ? "−" : "+"}</span>
            </summary>

            <div className="muscle-tree-content border-t border-[var(--border)] p-2">
              <label className="mb-2 block text-xs font-bold">
                Muskel suchen
                <input type="search" value={regionSearch} onChange={event => setRegionSearch(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                  placeholder="Name oder Muskelgruppe" />
              </label>
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
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--foreground)]">
                    <input
                      checked={showAntagonists}
                      className="size-4 accent-violet-500"
                      onChange={(event) => setShowAntagonists(event.currentTarget.checked)}
                      type="checkbox"
                    />
                    Gegenmuskel anzeigen
                  </label>
                  {interactive && mode === "select" && showAntagonists && antagonistIds.length > 0 ? (
                    <button
                      className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-200 dark:hover:bg-violet-900/50"
                      onClick={addAntagonistsToSelection}
                      type="button"
                    >
                      Gegenmuskeln übernehmen ({antagonistIds.length})
                    </button>
                  ) : null}
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

              <div className="grid w-full gap-1">
                {groupedOptions.map(([category, entries]) => {
                  const selectedCount = entries.filter((entry) => selectedById.has(entry.id)).length;
                  const categoryOpen = regionSearch.trim().length > 0 || openCategories.has(category);
                  return (
                    <details
                      className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
                      key={category}
                      onToggle={(event) => setCategoryOpen(category, event.currentTarget.open)}
                      open={categoryOpen}
                    >
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 marker:hidden">
                        <span className="font-black text-[var(--foreground)]">{category}</span>
                        <span className="flex items-center gap-2">
                          {selectedCount > 0 ? (
                            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-black text-[var(--foreground)]">{selectedCount}</span>
                          ) : null}
                          <span aria-hidden="true" className="font-black text-[var(--muted)]">{categoryOpen ? "−" : "+"}</span>
                        </span>
                      </summary>

                      <div className="ml-4 border-l-2 border-[var(--border)] p-1">
                        <div className="grid w-full gap-1">
                          {entries.map((option) => {
                            const selected = selectedById.get(option.id);
                            const secondary = selected?.emphasis === "secondary";
                            const isAntagonist = showAntagonists && antagonistIds.includes(option.id);
                            return (
                              <div
                                className={`flex min-h-11 items-center gap-2 rounded-lg border px-2 py-1 transition ${selected ? "border-[var(--border-strong)] bg-[var(--accent-soft)]" : isAntagonist ? "border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30" : "border-[var(--border)] bg-[var(--surface-subtle)]"}`}
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
                                    <span className="flex items-center gap-2">
                                      <span className="block text-sm font-bold text-[var(--foreground)]">{option.labelDe}{detailBodyRegion(option.id) ? ` (${[...new Set(optionParts(option.id).map(part => part.view === "front" ? "vorn" : "hinten"))].join(" / ")})` : " · Gesamtbereich"}</span>
                                      {isAntagonist ? <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-violet-700 dark:bg-violet-900 dark:text-violet-200">Gegenmuskel</span> : null}
                                    </span>
                                    {option.labelEn && option.labelEn !== option.labelDe ? (
                                      <span className="block text-[11px] text-[var(--muted)]">{option.labelEn}</span>
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

      {mode === "emphasis" || showAntagonists ? (
        <div className="flex flex-wrap gap-3 text-xs font-bold text-[var(--muted)]">
          {mode === "emphasis" ? <Legend color="#ef4444" label="Primär" /> : null}
          {mode === "emphasis" ? <Legend color="#3b82f6" label="Sekundär" /> : null}
          {showAntagonists ? <Legend color="#8b5cf6" label="Typischer Gegenmuskel" /> : null}
          {mode === "emphasis" && interactive ? <span>Karte: Primär → Sekundär → Aus · Liste: Checkbox + P/S</span> : null}
        </div>
      ) : null}

      {mode !== "display" && selection.length > 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">Ausgewählte Muskeln</div>
          <div className="flex flex-wrap gap-2">
            {selection.map((item) => {
              const option = optionById.get(item.id);
              if (!option) return null;
              const secondary = item.emphasis === "secondary";
              return (
                <button
                  className="rounded-full border px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-900"
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
          {showAntagonists && antagonistIds.length > 0 ? (
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <div className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-violet-600 dark:text-violet-300">Typische Gegenmuskeln</div>
              <div className="flex flex-wrap gap-2">
                {antagonistIds.map((id) => (
                  <span className="rounded-full border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-200" key={id}>
                    {optionById.get(id)?.labelDe ?? id}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showDebug ? (
        <details className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-2 text-xs">
          <summary className="min-h-8 cursor-pointer font-black">Koordinaten-Debug · {debugPoints.length} Punkte</summary>
          <div className="mt-1 font-mono text-[var(--muted)]">
            Raster: {MUSCLE_MAP_REFERENCE_SIZE.width} × {MUSCLE_MAP_REFERENCE_SIZE.height} · Skalierung: {scaleX.toFixed(3)} × {scaleY.toFixed(3)}
          </div>
          <div className="mt-1 font-mono text-[var(--muted)]">Treffer: {debugLastHit ?? "keine hinterlegte Region"}</div>
          <div className="mt-1 font-mono text-[var(--muted)]">Letzter Punkt: {debugPoints.at(-1)?.join(" / ") ?? "–"}</div>
          <textarea className="mt-2 min-h-20 w-full rounded-lg border border-[var(--border)] p-2 font-mono" readOnly value={`coordinates: [${debugCoordinates}]`} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-bold" onClick={() => setDebugPoints((points) => points.slice(0, -1))} type="button">Undo Point</button>
            <button className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-bold" onClick={() => setDebugPoints([])} type="button">Clear</button>
            <button className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-bold" onClick={() => void navigator.clipboard.writeText(`[${debugCoordinates}]`)} type="button">Koordinaten kopieren</button>
          </div>
        </details>
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
