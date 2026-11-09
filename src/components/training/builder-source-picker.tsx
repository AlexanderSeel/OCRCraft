"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";
import { Disclosure } from "@/components/ui/disclosure";
import { buttonClass, formControlClass } from "@/components/ui/form";
import type { TrainingBuilderSourceOption } from "./training-builder-panel";

export function BuilderSourcePicker({ options, source, unavailable, mode }: {
  readonly options: readonly TrainingBuilderSourceOption[];
  readonly source?: string;
  readonly unavailable: boolean;
  readonly mode: "ai" | "local";
}) {
  const { dictionary } = useLocale();
  const text = dictionary.builderEntry;
  return (
    <Disclosure className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4" open={Boolean(source)} summary={text.source}>
      <form className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end" method="get">
        <input name="planner" type="hidden" value="detailed" /><input name="mode" type="hidden" value={mode} />
        <label className="grid gap-1.5 text-sm font-bold">{text.sourceLabel}<select className={formControlClass} defaultValue={source ?? ""} name="source"><option value="">{text.newTraining}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.title} · {option.totalDurationMinutes} Min. · {option.itemCount} {text.exercises}</option>)}</select></label>
        <button className={buttonClass("primary")} type="submit">{text.load}</button>
        {source ? <Link className={buttonClass("secondary")} href={`/training/builder?planner=detailed&mode=${mode}`}>{text.reset}</Link> : null}
      </form>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text.sourceHelp}</p>
      {unavailable ? <p className="mt-2 text-sm font-bold text-[var(--danger)]" role="alert">{text.sourceUnavailable}</p> : null}
    </Disclosure>
  );
}
