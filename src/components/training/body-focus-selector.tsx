"use client";

import { useState } from "react";

type BodyView = "front" | "back";

type RegionDefinition = {
  readonly id: string;
  readonly label: string;
  readonly view: BodyView | "both";
  readonly left: string;
  readonly top: string;
};

const regions: readonly RegionDefinition[] = [
  { id: "shoulders", label: "Schultern", view: "both", left: "50%", top: "24%" },
  { id: "upper-back", label: "Oberer Rücken", view: "back", left: "50%", top: "34%" },
  { id: "forearms-grip", label: "Unterarme / Grip", view: "both", left: "20%", top: "45%" },
  { id: "core", label: "Core", view: "front", left: "50%", top: "45%" },
  { id: "hips", label: "Hüfte", view: "both", left: "50%", top: "55%" },
  { id: "glutes", label: "Gesäß", view: "back", left: "50%", top: "59%" },
  { id: "quadriceps", label: "Oberschenkel vorn", view: "front", left: "39%", top: "68%" },
  { id: "hamstrings", label: "Oberschenkel hinten", view: "back", left: "61%", top: "68%" },
  { id: "calves", label: "Waden", view: "both", left: "61%", top: "82%" },
];

interface BodyFocusSelectorProps {
  readonly selected: readonly string[];
  readonly onToggle: (regionId: string) => void;
}

export function BodyFocusSelector({ selected, onToggle }: BodyFocusSelectorProps) {
  const [view, setView] = useState<BodyView>("front");
  const visibleRegions = regions.filter((region) => region.view === "both" || region.view === view);

  return (
    <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
        <div className="mb-3 grid grid-cols-2 rounded-xl bg-white p-1 ring-1 ring-[var(--border)]">
          {(["front", "back"] as const).map((bodyView) => (
            <button
              aria-pressed={view === bodyView}
              className={`min-h-9 rounded-lg text-xs font-black ${view === bodyView ? "bg-[var(--dark)] text-white" : "text-[var(--muted)]"}`}
              key={bodyView}
              onClick={() => setView(bodyView)}
              type="button"
            >
              {bodyView === "front" ? "Vorne" : "Hinten"}
            </button>
          ))}
        </div>

        <div className="relative mx-auto h-[390px] w-[190px]" aria-label={`Körperansicht ${view === "front" ? "vorne" : "hinten"}`}>
          <div aria-hidden="true" className="absolute left-1/2 top-[3%] size-14 -translate-x-1/2 rounded-full border-2 border-[#aeb8c1] bg-white" />
          <div aria-hidden="true" className="absolute left-1/2 top-[18%] h-36 w-20 -translate-x-1/2 rounded-[35px_35px_24px_24px] border-2 border-[#aeb8c1] bg-white" />
          <div aria-hidden="true" className="absolute left-[25%] top-[22%] h-36 w-7 rotate-[10deg] rounded-full border-2 border-[#aeb8c1] bg-white" />
          <div aria-hidden="true" className="absolute right-[25%] top-[22%] h-36 w-7 -rotate-[10deg] rounded-full border-2 border-[#aeb8c1] bg-white" />
          <div aria-hidden="true" className="absolute left-[35%] top-[52%] h-40 w-8 rotate-[3deg] rounded-full border-2 border-[#aeb8c1] bg-white" />
          <div aria-hidden="true" className="absolute right-[35%] top-[52%] h-40 w-8 -rotate-[3deg] rounded-full border-2 border-[#aeb8c1] bg-white" />

          {visibleRegions.map((region) => {
            const active = selected.includes(region.id);
            return (
              <button
                aria-label={`${region.label} ${active ? "abwählen" : "auswählen"}`}
                aria-pressed={active}
                className={`absolute z-10 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-[10px] font-black shadow-sm transition ${
                  active
                    ? "border-[var(--dark)] bg-[var(--accent)] text-[var(--dark)] scale-110"
                    : "border-white bg-[var(--dark)] text-white hover:scale-110"
                }`}
                key={`${view}-${region.id}`}
                onClick={() => onToggle(region.id)}
                style={{ left: region.left, top: region.top }}
                title={region.label}
                type="button"
              >
                {active ? "✓" : "+"}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-sm font-black">Ausgewählte Bereiche</div>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          Die Karte dient der Trainingsplanung, nicht der medizinischen Anatomie. Mehrere Bereiche können kombiniert werden.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {regions.map((region) => {
            const active = selected.includes(region.id);
            return (
              <button
                aria-pressed={active}
                className={`min-h-10 rounded-xl border px-3 text-sm font-bold ${
                  active
                    ? "border-[var(--dark)] bg-[var(--dark)] text-white"
                    : "border-[var(--border)] bg-white hover:bg-[var(--surface-subtle)]"
                }`}
                key={region.id}
                onClick={() => onToggle(region.id)}
                type="button"
              >
                {region.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
