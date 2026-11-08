"use client";

import type { SeedReviewEvidence } from "@/server/exercises/seed-review-evidence-core";
import { useLocale } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";

export function SeedReviewEvidenceView({ evidence }: { readonly evidence: SeedReviewEvidence }) {
  const { dictionary } = useLocale();
  const copy = dictionary.seedReviewEvidence;
  const metrics = [
    [copy.versioned,evidence.versionedPassed], [copy.compatibility,evidence.compatibilityPassed],
    [copy.needsWork,evidence.needsWork], [copy.missing,evidence.missing],
  ] as const;
  return <section aria-label={copy.title} className="mt-4" data-testid="seed-review-evidence">
    <Card as="div" className="p-3">
      <h3 className="font-black">{copy.title}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map(([label,count]) => <div className="min-w-0" key={label}>
          <dt className="break-words text-xs font-semibold text-[var(--muted)]">{label}</dt>
          <dd className="mt-1 text-lg font-black">{count}</dd>
        </div>)}
      </dl>
      <p className="mt-3 rounded-md border border-[var(--warning)] bg-[var(--warning-bg)] p-3 text-sm leading-6 text-[var(--warning)]">{copy.explanation}</p>
    </Card>
  </section>;
}
