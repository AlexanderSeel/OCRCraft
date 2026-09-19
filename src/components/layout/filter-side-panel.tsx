"use client";

import { useState } from "react";

export function FilterSidePanel({ title = "Filter", children }: { readonly title?: string; readonly children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside data-testid="filter-side-panel" className={`relative h-fit min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-[width] lg:sticky lg:top-20 ${collapsed ? "lg:w-12" : "lg:w-[20rem] lg:max-w-full"}`}>
      <div className={`flex min-h-12 items-center border-b border-[var(--border)] ${collapsed ? "justify-center px-1" : "justify-between gap-2 px-3"}`}>
        {!collapsed ? <h2 className="text-sm font-black">{title}</h2> : null}
        <button aria-expanded={!collapsed} aria-label={collapsed ? `${title} vergrößern` : `${title} verkleinern`} className="grid size-10 shrink-0 place-items-center rounded-md text-lg font-black text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]" onClick={() => setCollapsed((value) => !value)} title={collapsed ? `${title} vergrößern` : `${title} verkleinern`} type="button">{collapsed ? "›" : "‹"}</button>
      </div>
      {!collapsed ? <div className="p-3">{children}</div> : null}
    </aside>
  );
}
