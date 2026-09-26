"use client";

import { MuscleMap } from "@/components/body/muscle-map";
import { buttonClass } from "@/components/ui/form";
import {
  BODY_REGION_OPTIONS,
  getBodyRegionAntagonists,
  normalizeBodyRegionId,
} from "@/domain/body-regions";

interface BodyFocusSelectorProps {
  readonly selected: readonly string[];
  readonly onToggle: (regionId: string) => void;
  readonly title?: string;
  readonly description?: string;
  readonly visualCompact?: boolean;
  readonly showAntagonistSuggestions?: boolean;
}

export function BodyFocusSelector({
  selected,
  onToggle,
  title = "Körper- und Muskelfokus",
  description = "Wähle die Muskel- und Körperregionen, die im Training gezielt berücksichtigt werden sollen. Die Karte dient der Trainingsplanung, nicht der medizinischen Anatomie.",
  visualCompact = false,
  showAntagonistSuggestions = !visualCompact,
}: BodyFocusSelectorProps) {
  const selectedIds = new Set(selected);
  const labelById = new Map<string, string>(BODY_REGION_OPTIONS.map((option) => [option.id, option.labelDe]));
  const antagonistSources = new Map<string, string[]>();

  if (showAntagonistSuggestions) {
    for (const sourceId of selected) {
      const normalizedSourceId = normalizeBodyRegionId(sourceId);
      if (!normalizedSourceId) continue;
      for (const antagonistId of getBodyRegionAntagonists(normalizedSourceId)) {
        if (selectedIds.has(antagonistId)) continue;
        const sources = antagonistSources.get(antagonistId) ?? [];
        sources.push(labelById.get(normalizedSourceId) ?? normalizedSourceId);
        antagonistSources.set(antagonistId, sources);
      }
    }
  }

  const antagonistSuggestions = BODY_REGION_OPTIONS.flatMap((option) => {
    const sources = antagonistSources.get(option.id);
    return sources?.length ? [{ option, sources }] : [];
  });

  return (
    <div className="space-y-3">
      <MuscleMap
        description={description}
        mode="select"
        onChange={(next) => {
          const current = new Set(selected);
          const nextIds = new Set(next.map((item) => item.id));
          const changed = BODY_REGION_OPTIONS.find((region) => current.has(region.id) !== nextIds.has(region.id));
          if (changed) onToggle(changed.id);
        }}
        options={BODY_REGION_OPTIONS}
        title={title}
        value={selected.map((id) => ({ id }))}
        visualCompact={visualCompact}
      />

      {antagonistSuggestions.length > 0 ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">
                Ausgleich / Gegenmuskel
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Optional ergänzen. Die Zuordnung ist eine typische Trainingsbeziehung und hängt von der konkreten Bewegung ab.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {antagonistSuggestions.map(({ option, sources }) => (
              <button
                className={buttonClass("secondary", "rounded-lg px-3 py-2 text-left text-xs hover:border-[var(--accent-strong)] hover:bg-[var(--accent-soft)]")}
                key={option.id}
                onClick={() => onToggle(option.id)}
                title={`Typischer Gegenmuskel zu ${sources.join(", ")}`}
                type="button"
              >
                <span className="block font-black">+ {option.labelDe}</span>
                <span className="mt-0.5 block font-normal text-[var(--muted)]">
                  zu {sources.join(" / ")}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
