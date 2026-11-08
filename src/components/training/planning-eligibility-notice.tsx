"use client";

import { useLocale } from "@/components/i18n/locale-provider";
import { Disclosure } from "@/components/ui/disclosure";

export function PlanningEligibilityNotice() {
  const { dictionary } = useLocale();
  return <Disclosure className="my-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3" summaryClassName="min-h-11 py-2 text-sm font-bold" summary={dictionary.planningEligibility.title}>
    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{dictionary.planningEligibility.description}</p>
  </Disclosure>;
}
