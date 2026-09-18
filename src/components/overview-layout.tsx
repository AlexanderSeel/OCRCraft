"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const views = [
  ["list", "Liste"], ["small", "Klein"], ["medium", "Mittel"],
  ["large", "Groß"], ["detail", "Detail"],
] as const;
const eventName = "ocrcraft-overview-view";
const memoryViews = new Map<string, string>();
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(eventName, callback); };
}
function readView(key: string) {
  try {
    const value = localStorage.getItem(key);
    return views.find(([id]) => id === value)?.[0] ?? "small";
  } catch { return views.find(([id]) => id === memoryViews.get(key))?.[0] ?? "small"; }
}

/** Server-rendered cards stay on the server; this boundary only controls density. */
export function OverviewLayout({ children, storageKey }: { readonly children: ReactNode; readonly storageKey: string }) {
  const view = useSyncExternalStore(subscribe, () => readView(storageKey), () => "small");
  return (
    <div className="overview-layout space-y-3" data-testid="overview-layout" data-view={view}>
      <div aria-label="Übersichtsdarstellung" className="flex flex-wrap items-center gap-1" role="group">
        <span className="mr-2 text-xs font-bold text-[var(--muted)]">Ansicht</span>
        {views.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={id === view}
            className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-bold ${id === view ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface)]"}`}
            onClick={() => {
              memoryViews.set(storageKey, id);
              try { localStorage.setItem(storageKey, id); } catch { /* Keep the view usable without persistence. */ }
              window.dispatchEvent(new Event(eventName));
            }}>
            {label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
