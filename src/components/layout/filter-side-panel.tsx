"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { buttonClass } from "@/components/ui/form";

const desktopQuery = "(min-width: 1024px)";
function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function FilterSidePanel({ title = "Filter", activeFilterCount = 0, children }: {
  readonly title?: string;
  readonly activeFilterCount?: number;
  readonly children: React.ReactNode;
}) {
  const { dictionary } = useLocale();
  const desktop = useSyncExternalStore(subscribeToViewport, () => window.matchMedia(desktopQuery).matches, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const expanded = desktop ? desktopOpen : mobileOpen;
  const contentId = useId();
  const countId = useId();
  return (
    <aside data-testid="filter-side-panel" className="relative h-fit min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] lg:sticky lg:top-20 lg:w-[20rem] lg:max-w-full">
      <h2>
        <button aria-controls={contentId} aria-describedby={countId} aria-expanded={expanded} aria-label={`${title}: ${expanded ? dictionary.filters.hide : dictionary.filters.show}`} className={buttonClass("ghost", "w-full justify-between gap-2 px-3 text-sm")} onClick={() => desktop ? setDesktopOpen((value) => !value) : setMobileOpen((value) => !value)} type="button">
          <span className="mr-auto">{title}</span>
          <span className="text-xs text-[var(--muted)]" id={countId}>{activeFilterCount} {dictionary.filters.active}</span>
          <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        </button>
      </h2>
      <div className="border-t border-[var(--border)] p-3" hidden={!expanded} id={contentId}>{children}</div>
    </aside>
  );
}
