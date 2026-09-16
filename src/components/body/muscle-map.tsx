"use client";

import { useMemo, useState } from "react";

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
}

type Shape =
  | { readonly kind: "ellipse"; readonly cx: number; readonly cy: number; readonly rx: number; readonly ry: number }
  | { readonly kind: "rect"; readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly rx?: number }
  | { readonly kind: "polygon"; readonly points: string };

const SHAPES: Readonly<Record<string, readonly Shape[]>> = {
  "full-body": [
    { kind: "rect", x: 16, y: 9, width: 160, height: 492, rx: 70 },
    { kind: "rect", x: 200, y: 9, width: 160, height: 492, rx: 70 },
  ],
  neck: [
    { kind: "rect", x: 82, y: 53, width: 28, height: 29, rx: 9 },
    { kind: "rect", x: 271, y: 53, width: 28, height: 29, rx: 9 },
  ],
  traps: [
    { kind: "polygon", points: "75,80 96,69 117,80 109,102 83,102" },
    { kind: "polygon", points: "254,99 274,78 285,109 296,78 316,99 304,139 285,153 266,139" },
  ],
  shoulders: [
    { kind: "ellipse", cx: 57, cy: 110, rx: 20, ry: 19 },
    { kind: "ellipse", cx: 135, cy: 110, rx: 20, ry: 19 },
    { kind: "ellipse", cx: 246, cy: 110, rx: 20, ry: 19 },
    { kind: "ellipse", cx: 324, cy: 110, rx: 20, ry: 19 },
  ],
  "rear-delts": [
    { kind: "ellipse", cx: 247, cy: 114, rx: 16, ry: 14 },
    { kind: "ellipse", cx: 323, cy: 114, rx: 16, ry: 14 },
  ],
  chest: [
    { kind: "ellipse", cx: 78, cy: 130, rx: 28, ry: 20 },
    { kind: "ellipse", cx: 114, cy: 130, rx: 28, ry: 20 },
  ],
  "upper-back": [
    { kind: "polygon", points: "247,117 274,102 284,153 267,183 243,152" },
    { kind: "polygon", points: "323,117 296,102 286,153 303,183 327,152" },
  ],
  lats: [
    { kind: "polygon", points: "246,151 269,157 278,219 258,239 242,190" },
    { kind: "polygon", points: "324,151 301,157 292,219 312,239 328,190" },
  ],
  "upper-arms": [
    { kind: "ellipse", cx: 44, cy: 177, rx: 14, ry: 38 },
    { kind: "ellipse", cx: 148, cy: 177, rx: 14, ry: 38 },
    { kind: "ellipse", cx: 230, cy: 177, rx: 14, ry: 38 },
    { kind: "ellipse", cx: 340, cy: 177, rx: 14, ry: 38 },
  ],
  biceps: [
    { kind: "ellipse", cx: 44, cy: 171, rx: 10, ry: 27 },
    { kind: "ellipse", cx: 148, cy: 171, rx: 10, ry: 27 },
  ],
  triceps: [
    { kind: "ellipse", cx: 230, cy: 174, rx: 10, ry: 29 },
    { kind: "ellipse", cx: 340, cy: 174, rx: 10, ry: 29 },
  ],
  "forearms-grip": [
    { kind: "ellipse", cx: 31, cy: 249, rx: 11, ry: 43 },
    { kind: "ellipse", cx: 161, cy: 249, rx: 11, ry: 43 },
    { kind: "ellipse", cx: 217, cy: 249, rx: 11, ry: 43 },
    { kind: "ellipse", cx: 353, cy: 249, rx: 11, ry: 43 },
  ],
  core: [
    { kind: "rect", x: 75, y: 157, width: 42, height: 108, rx: 17 },
  ],
  abs: [
    { kind: "rect", x: 82, y: 165, width: 28, height: 91, rx: 10 },
  ],
  obliques: [
    { kind: "polygon", points: "58,160 75,165 75,246 61,234 51,191" },
    { kind: "polygon", points: "134,160 117,165 117,246 131,234 141,191" },
  ],
  "lower-back": [
    { kind: "polygon", points: "264,194 285,207 306,194 304,254 285,278 266,254" },
  ],
  hips: [
    { kind: "ellipse", cx: 71, cy: 282, rx: 24, ry: 24 },
    { kind: "ellipse", cx: 121, cy: 282, rx: 24, ry: 24 },
    { kind: "ellipse", cx: 260, cy: 282, rx: 24, ry: 24 },
    { kind: "ellipse", cx: 310, cy: 282, rx: 24, ry: 24 },
  ],
  glutes: [
    { kind: "ellipse", cx: 265, cy: 307, rx: 25, ry: 33 },
    { kind: "ellipse", cx: 305, cy: 307, rx: 25, ry: 33 },
  ],
  quadriceps: [
    { kind: "ellipse", cx: 69, cy: 352, rx: 22, ry: 59 },
    { kind: "ellipse", cx: 123, cy: 352, rx: 22, ry: 59 },
  ],
  hamstrings: [
    { kind: "ellipse", cx: 259, cy: 355, rx: 21, ry: 60 },
    { kind: "ellipse", cx: 311, cy: 355, rx: 21, ry: 60 },
  ],
  adductors: [
    { kind: "ellipse", cx: 87, cy: 351, rx: 12, ry: 54 },
    { kind: "ellipse", cx: 105, cy: 351, rx: 12, ry: 54 },
  ],
  calves: [
    { kind: "ellipse", cx: 69, cy: 435, rx: 17, ry: 47 },
    { kind: "ellipse", cx: 123, cy: 435, rx: 17, ry: 47 },
    { kind: "ellipse", cx: 259, cy: 435, rx: 17, ry: 47 },
    { kind: "ellipse", cx: 311, cy: 435, rx: 17, ry: 47 },
  ],
  tibialis: [
    { kind: "ellipse", cx: 74, cy: 435, rx: 8, ry: 41 },
    { kind: "ellipse", cx: 118, cy: 435, rx: 8, ry: 41 },
  ],
  "ankles-feet": [
    { kind: "ellipse", cx: 70, cy: 487, rx: 20, ry: 14 },
    { kind: "ellipse", cx: 122, cy: 487, rx: 20, ry: 14 },
    { kind: "ellipse", cx: 258, cy: 487, rx: 20, ry: 14 },
    { kind: "ellipse", cx: 312, cy: 487, rx: 20, ry: 14 },
  ],
};

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
}: MuscleMapProps) {
  const [internalSelection, setInternalSelection] = useState<MuscleMapValue[]>(() => [...value]);
  const selection = onChange ? value : internalSelection;
  const optionById = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  const selectedById = useMemo(() => new Map(selection.map((item) => [item.id, item])), [selection]);
  const visibleOptions = options.filter((option) => SHAPES[option.id]);
  const interactive = mode !== "display" && !disabled;

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

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {!compact ? (
        <div>
          <h3 className="font-black text-[var(--foreground)]">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
        </div>
      ) : null}

      <div className={compact ? "mx-auto w-full max-w-44" : "mx-auto w-full max-w-xl"}>
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muscle-canvas)] shadow-[var(--shadow-card)]">
          {/* OCRCraft-owned neutral anatomy illustration; semantic highlights stay separate and interactive. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Anatomische Vorder- und Rückansicht zur Auswahl von Muskelgruppen"
            className="block h-auto w-full"
            src="/assets/muscle-map-anatomy.svg"
          />
          <svg
            aria-label="Interaktive Muskelkarte"
            className="absolute inset-0 h-full w-full"
            role="group"
            viewBox="0 0 376 504"
          >
            {visibleOptions.map((option) => {
              const selected = selectedById.get(option.id);
              const emphasis = selected?.emphasis ?? "primary";
              const fill = selected
                ? emphasis === "secondary"
                  ? "var(--muscle-secondary)"
                  : "var(--muscle-primary)"
                : "transparent";
              const stroke = selected ? "var(--muscle-stroke)" : "transparent";
              return (
                <g
                  aria-label={option.labelDe}
                  aria-pressed={interactive ? Boolean(selected) : undefined}
                  className={interactive ? "cursor-pointer outline-none" : undefined}
                  key={option.id}
                  onClick={() => cycle(option.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      cycle(option.id);
                    }
                  }}
                  role={interactive ? "button" : "img"}
                  tabIndex={interactive ? 0 : undefined}
                >
                  <title>{option.labelDe}</title>
                  {SHAPES[option.id].map((shape, index) => (
                    <ShapeElement
                      fill={fill}
                      fullBody={option.id === "full-body"}
                      key={`${option.id}-${index}`}
                      selected={Boolean(selected)}
                      shape={shape}
                      stroke={stroke}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        </div>
        {!compact ? (
          <div className="mt-2 grid grid-cols-2 text-center text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]">
            <span>Vorderseite</span>
            <span>Rückseite</span>
          </div>
        ) : null}
      </div>

      {mode === "emphasis" ? (
        <div className="flex flex-wrap gap-3 text-xs font-bold text-[var(--muted)]">
          <Legend color="var(--muscle-primary)" label="Primär" />
          <Legend color="var(--muscle-secondary)" label="Sekundär" />
          {interactive ? <span>Klickfolge: Primär → Sekundär → Aus</span> : null}
        </div>
      ) : null}

      {!compact && selection.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selection.map((item) => {
            const option = optionById.get(item.id);
            if (!option) return null;
            const secondary = item.emphasis === "secondary";
            return (
              <button
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold text-[var(--foreground)]"
                disabled={!interactive}
                key={item.id}
                onClick={() => cycle(item.id)}
                style={{
                  background: secondary ? "var(--muscle-secondary-soft)" : "var(--muscle-primary-soft)",
                  borderColor: secondary ? "var(--muscle-secondary)" : "var(--muscle-primary)",
                }}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ background: secondary ? "var(--muscle-secondary)" : "var(--muscle-primary)" }}
                />
                {option.labelDe}{interactive ? " ×" : ""}
              </button>
            );
          })}
        </div>
      ) : null}

      {interactive && !compact ? (
        <details className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <summary className="cursor-pointer text-xs font-black text-[var(--muted)]">Muskelgruppen als Liste</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleOptions.map((option) => {
              const selected = selectedById.get(option.id);
              return (
                <button
                  aria-pressed={Boolean(selected)}
                  className="rounded-lg border px-2.5 py-1.5 text-xs font-bold text-[var(--foreground)]"
                  key={`list-${option.id}`}
                  onClick={() => cycle(option.id)}
                  style={{
                    background: selected ? "var(--muscle-primary-soft)" : "var(--surface)",
                    borderColor: selected ? "var(--muscle-primary)" : "var(--border)",
                    color: selected ? "var(--foreground)" : "var(--muted)",
                  }}
                  type="button"
                >
                  {option.labelDe}
                </button>
              );
            })}
          </div>
        </details>
      ) : null}

      {mode !== "display" ? selection.map((item) => (
        <span key={`fields-${item.id}`}>
          <input name={fieldName} type="hidden" value={item.id} />
          {mode === "emphasis" ? (
            <input
              name={`${emphasisFieldPrefix}${item.id}`}
              type="hidden"
              value={item.emphasis ?? "primary"}
            />
          ) : null}
        </span>
      )) : null}
    </div>
  );
}

function ShapeElement({
  shape,
  fill,
  stroke,
  selected,
  fullBody,
}: {
  readonly shape: Shape;
  readonly fill: string;
  readonly stroke: string;
  readonly selected: boolean;
  readonly fullBody: boolean;
}) {
  const common = {
    fill,
    stroke,
    strokeWidth: selected ? 1.8 : 0,
    style: { transition: "fill 140ms ease, stroke 140ms ease, opacity 140ms ease" },
    opacity: selected ? fullBody ? 0.22 : 0.82 : 0.01,
  };
  if (shape.kind === "ellipse") return <ellipse {...common} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />;
  if (shape.kind === "rect") return <rect {...common} height={shape.height} rx={shape.rx ?? 0} width={shape.width} x={shape.x} y={shape.y} />;
  return <polygon {...common} points={shape.points} />;
}

function Legend({ color, label }: { readonly color: string; readonly label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
