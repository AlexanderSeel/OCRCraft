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
    { kind: "rect", x: 13, y: 22, width: 165, height: 462, rx: 72 },
    { kind: "rect", x: 199, y: 22, width: 164, height: 462, rx: 72 },
  ],
  neck: [
    { kind: "rect", x: 82, y: 51, width: 28, height: 31, rx: 10 },
    { kind: "rect", x: 270, y: 49, width: 29, height: 35, rx: 10 },
  ],
  shoulders: [
    { kind: "ellipse", cx: 57, cy: 105, rx: 22, ry: 20 },
    { kind: "ellipse", cx: 136, cy: 105, rx: 22, ry: 20 },
    { kind: "ellipse", cx: 244, cy: 105, rx: 22, ry: 20 },
    { kind: "ellipse", cx: 324, cy: 105, rx: 22, ry: 20 },
  ],
  chest: [
    { kind: "ellipse", cx: 78, cy: 132, rx: 31, ry: 22 },
    { kind: "ellipse", cx: 113, cy: 132, rx: 31, ry: 22 },
  ],
  "upper-back": [
    { kind: "polygon", points: "244,116 274,91 285,158 263,183 238,151" },
    { kind: "polygon", points: "324,116 296,91 287,158 307,183 333,151" },
  ],
  lats: [
    { kind: "polygon", points: "247,155 271,151 278,219 258,236 241,193" },
    { kind: "polygon", points: "322,155 298,151 290,219 310,236 329,193" },
  ],
  "upper-arms": [
    { kind: "ellipse", cx: 46, cy: 176, rx: 15, ry: 38 },
    { kind: "ellipse", cx: 146, cy: 176, rx: 15, ry: 38 },
    { kind: "ellipse", cx: 231, cy: 176, rx: 15, ry: 38 },
    { kind: "ellipse", cx: 338, cy: 176, rx: 15, ry: 38 },
  ],
  "forearms-grip": [
    { kind: "ellipse", cx: 31, cy: 245, rx: 12, ry: 43 },
    { kind: "ellipse", cx: 160, cy: 245, rx: 12, ry: 43 },
    { kind: "ellipse", cx: 218, cy: 245, rx: 12, ry: 43 },
    { kind: "ellipse", cx: 350, cy: 245, rx: 12, ry: 43 },
  ],
  core: [
    { kind: "rect", x: 75, y: 159, width: 42, height: 104, rx: 18 },
  ],
  obliques: [
    { kind: "polygon", points: "58,163 75,164 75,245 61,233 51,192" },
    { kind: "polygon", points: "134,163 117,164 117,245 132,233 142,192" },
  ],
  "lower-back": [
    { kind: "polygon", points: "271,190 298,190 304,254 285,278 265,254" },
  ],
  hips: [
    { kind: "ellipse", cx: 70, cy: 282, rx: 25, ry: 25 },
    { kind: "ellipse", cx: 122, cy: 282, rx: 25, ry: 25 },
    { kind: "ellipse", cx: 258, cy: 282, rx: 25, ry: 25 },
    { kind: "ellipse", cx: 311, cy: 282, rx: 25, ry: 25 },
  ],
  glutes: [
    { kind: "ellipse", cx: 265, cy: 305, rx: 26, ry: 34 },
    { kind: "ellipse", cx: 306, cy: 305, rx: 26, ry: 34 },
  ],
  quadriceps: [
    { kind: "ellipse", cx: 67, cy: 350, rx: 23, ry: 60 },
    { kind: "ellipse", cx: 124, cy: 350, rx: 23, ry: 60 },
  ],
  hamstrings: [
    { kind: "ellipse", cx: 258, cy: 355, rx: 22, ry: 61 },
    { kind: "ellipse", cx: 313, cy: 355, rx: 22, ry: 61 },
  ],
  adductors: [
    { kind: "ellipse", cx: 86, cy: 351, rx: 13, ry: 55 },
    { kind: "ellipse", cx: 106, cy: 351, rx: 13, ry: 55 },
  ],
  calves: [
    { kind: "ellipse", cx: 66, cy: 431, rx: 18, ry: 48 },
    { kind: "ellipse", cx: 126, cy: 431, rx: 18, ry: 48 },
    { kind: "ellipse", cx: 258, cy: 431, rx: 18, ry: 48 },
    { kind: "ellipse", cx: 315, cy: 431, rx: 18, ry: 48 },
  ],
  "ankles-feet": [
    { kind: "ellipse", cx: 69, cy: 482, rx: 22, ry: 18 },
    { kind: "ellipse", cx: 126, cy: 482, rx: 22, ry: 18 },
    { kind: "ellipse", cx: 257, cy: 482, rx: 22, ry: 18 },
    { kind: "ellipse", cx: 316, cy: 482, rx: 22, ry: 18 },
  ],
};

export function MuscleMap({
  options,
  value = [],
  mode = "select",
  fieldName = "muscle",
  emphasisFieldPrefix = "muscleEmphasis:",
  disabled = false,
  compact = false,
  title = "Muskelgruppen",
  description,
}: MuscleMapProps) {
  const [selection, setSelection] = useState<MuscleMapValue[]>(() => [...value]);
  const optionById = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  const selectedById = useMemo(() => new Map(selection.map((item) => [item.id, item])), [selection]);
  const visibleOptions = options.filter((option) => SHAPES[option.id]);
  const interactive = mode !== "display" && !disabled;

  function cycle(id: string) {
    if (!interactive) return;
    setSelection((current) => {
      const existing = current.find((item) => item.id === id);
      if (mode === "select") {
        return existing ? current.filter((item) => item.id !== id) : [...current, { id }];
      }
      if (!existing) return [...current, { id, emphasis: "primary" }];
      if ((existing.emphasis ?? "primary") === "primary") {
        return current.map((item) => item.id === id ? { ...item, emphasis: "secondary" } : item);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {!compact ? (
        <div>
          <h3 className="font-black text-[var(--foreground)]">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
        </div>
      ) : null}

      <div className={compact ? "relative mx-auto w-full max-w-48" : "relative mx-auto w-full max-w-md"}>
        {/* Generated specifically for OCRCraft as a neutral anatomical base; semantic highlights are rendered separately. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Anatomische Vorder- und Rückansicht zur Auswahl von Muskelgruppen"
          className="block h-auto w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)]"
          src="/assets/muscle-map-base.webp"
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
              ? emphasis === "secondary" ? "var(--muscle-secondary, #3b82f6)" : "var(--muscle-primary, #ef4444)"
              : "transparent";
            const stroke = selected ? fill : interactive ? "rgba(15, 23, 42, 0.18)" : "transparent";
            return (
              <g
                aria-label={option.labelDe}
                aria-pressed={Boolean(selected)}
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

      {mode === "emphasis" ? (
        <div className="flex flex-wrap gap-3 text-xs font-bold text-[var(--muted)]">
          <Legend color="var(--muscle-primary, #ef4444)" label="Primär" />
          <Legend color="var(--muscle-secondary, #3b82f6)" label="Sekundär" />
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
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${secondary ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200" : "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"}`}
                disabled={!interactive}
                key={item.id}
                onClick={() => cycle(item.id)}
                type="button"
              >
                {option.labelDe}{interactive ? " ×" : ""}
              </button>
            );
          })}
        </div>
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
}: {
  readonly shape: Shape;
  readonly fill: string;
  readonly stroke: string;
  readonly selected: boolean;
}) {
  const common = {
    fill,
    stroke,
    strokeWidth: selected ? 2.2 : 1.1,
    style: { transition: "fill 140ms ease, stroke 140ms ease, opacity 140ms ease" },
    opacity: selected ? 0.64 : 0.08,
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
