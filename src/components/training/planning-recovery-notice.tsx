"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { buttonClass } from "@/components/ui/form";

export function PlanningRecoveryNotice({ pending, status, restore, clear, testId }: {
  readonly pending: boolean;
  readonly status: "idle" | "saving" | "stored" | "restored" | "unavailable";
  readonly restore: () => void;
  readonly clear: () => void;
  readonly testId: string;
}) {
  const { dictionary } = useLocale();
  if (!pending && status === "idle") return null;
  return <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3" data-testid={testId}>
    <p className="text-sm font-bold" role="status">{pending ? dictionary.recovery.found : dictionary.recovery[status === "idle" ? "stored" : status]}</p>
    <p className="text-xs leading-5 text-[var(--muted)]">{dictionary.recovery.review}</p>
    <div className="flex flex-wrap gap-2">
      {pending ? <button className={buttonClass("secondary")} onClick={restore} type="button">{dictionary.recovery.restore}</button> : null}
      {pending || status === "stored" || status === "restored" ? <button className={buttonClass("ghost")} onClick={clear} type="button">{dictionary.recovery.discard}</button> : null}
    </div>
  </div>;
}
