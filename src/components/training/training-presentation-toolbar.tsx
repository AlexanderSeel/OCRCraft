"use client";

import Link from "@/components/navigation/app-link";
import { useLocale } from "@/components/i18n/locale-provider";
import { buttonClass } from "@/components/ui/form";
import { TrainingPresentationControls } from "./training-presentation-controls";

export function TrainingPresentationToolbar({ sessionId }: { readonly sessionId: string }) {
  const { dictionary } = useLocale();
  const text = dictionary.presentation;
  return (
    <div className="mb-5 grid min-w-0 gap-3 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className={buttonClass("secondary")} href={`/training/${sessionId}`}>{text.back}</Link>
        <span className="text-sm font-bold text-[var(--muted)]">{text.readonly}</span>
      </div>
      <div className="flex min-w-0 flex-wrap items-start gap-2">
        <Link className={buttonClass("secondary")} href={`/training/${sessionId}/print`}>{text.printView}</Link>
        <TrainingPresentationControls fullscreenTargetId="training-trainer-view" showPrint={false} />
      </div>
    </div>
  );
}
