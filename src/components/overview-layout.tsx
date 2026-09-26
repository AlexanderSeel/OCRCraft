"use client";

import { useEffect, useState, type ReactNode } from "react";
import { buttonClass } from "@/components/ui/form";

const views = [
  ["list", "Liste"], ["small", "Klein"],
  ["large", "Groß"], ["detail", "Detail"],
] as const;
function readView(key: string) {
  try {
    const value = localStorage.getItem(key);
    return views.find(([id]) => id === value)?.[0] ?? "small";
  } catch { return "small"; }
}

/** Server-rendered cards stay on the server; this boundary only controls density. */
export function OverviewLayout({ children, storageKey }: { readonly children: ReactNode; readonly storageKey: string }) {
  const [view, setView] = useState<(typeof views)[number][0]>("small");

  useEffect(() => {
    const syncView = () => setView(readView(storageKey));
    syncView();
    window.addEventListener("storage", syncView);
    return () => window.removeEventListener("storage", syncView);
  }, [storageKey]);

  return (
    <div className="overview-layout space-y-2.5" data-testid="overview-layout" data-view={view}>
      <div aria-label="Übersichtsdarstellung" className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)] p-1" role="group">
        <span className="mr-2 text-xs font-bold text-[var(--muted)]">Ansicht</span>
        {views.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={id === view}
            className={buttonClass("ghost", `min-h-10 rounded-sm border px-2.5 py-1.5 text-xs ${id === view ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--foreground)]" : "border-transparent bg-transparent text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"}`)}
            onClick={() => {
              setView(id);
              try { localStorage.setItem(storageKey, id); } catch { /* Keep the view usable without persistence. */ }
            }}>
            {label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
