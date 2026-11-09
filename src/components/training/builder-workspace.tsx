"use client";

import { useId, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { choiceButtonClass } from "@/components/ui/form";
import { resolveBuilderView, type BuilderView } from "./builder-view";

export function BuilderWorkspace({ quick, detailed }: { readonly quick: ReactNode; readonly detailed: ReactNode }) {
  const params = useSearchParams();
  const active = resolveBuilderView({ planner: params.get("planner"), source: params.get("source"), mode: params.get("mode") });
  const { dictionary } = useLocale();
  const text = dictionary.builderEntry;
  const id = useId();
  function select(view: BuilderView) {
    if (view === active) return;
    const next = new URLSearchParams(params.toString());
    next.set("planner", view);
    window.history.pushState(null, "", `${window.location.pathname}?${next}${window.location.hash}`);
  }
  return (
    <div className="space-y-5">
      <section aria-labelledby={`${id}-title`} data-tour="builder-choice">
        <h2 className="text-lg font-black" id={`${id}-title`}>{text.title}</h2>
        <div aria-label={text.title} className="mt-3 grid gap-3 sm:grid-cols-2" role="group">
          {(["quick", "detailed"] as const).map((view) => <button aria-controls={`${id}-${view}`} aria-describedby={`${id}-${view}-description`} aria-label={text[view]} aria-pressed={active === view} className={choiceButtonClass(active === view ? "primary" : "secondary")} key={view} onClick={() => select(view)} type="button"><span>{text[view]}</span><span className="text-sm font-normal leading-5" id={`${id}-${view}-description`}>{view === "quick" ? text.quickHelp : text.detailedHelp}</span></button>)}
        </div>
      </section>
      <div hidden={active !== "quick"} id={`${id}-quick`}>{quick}</div>
      <div hidden={active !== "detailed"} id={`${id}-detailed`}>{detailed}</div>
    </div>
  );
}
