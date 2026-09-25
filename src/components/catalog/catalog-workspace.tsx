import type { ReactNode } from "react";

export interface CatalogSummaryItem {
  readonly label: string;
  readonly value: ReactNode;
}

export function CatalogSummaryStrip({ items }: { readonly items: readonly CatalogSummaryItem[] }) {
  return (
    <div aria-label="Katalogübersicht" className="catalog-summary-strip sticky top-20 z-10 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 text-xs shadow-[var(--shadow-card)] backdrop-blur-sm">
      {items.map((item) => (
        <span className="inline-flex items-baseline gap-1.5" key={item.label}>
          <strong className="text-sm font-black text-[var(--foreground)]">{item.value}</strong>
          <span className="font-semibold text-[var(--muted)]">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
