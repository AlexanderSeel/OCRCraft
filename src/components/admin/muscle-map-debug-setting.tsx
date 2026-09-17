"use client";

import { useSyncExternalStore } from "react";
import { MUSCLE_MAP_DEBUG_STORAGE_KEY } from "@/components/body/muscle-map";

const eventName = "ocrcraft-muscle-map-debug-change";

export function MuscleMapDebugSetting() {
  const enabled = useSyncExternalStore(
    (callback) => { window.addEventListener("storage", callback); window.addEventListener(eventName, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(eventName, callback); }; },
    () => { try { return window.localStorage.getItem(MUSCLE_MAP_DEBUG_STORAGE_KEY) === "true"; } catch { return false; } },
    () => false,
  );
  return (
    <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm font-bold">
      <input checked={enabled} className="size-4 accent-[var(--accent-strong)]" onChange={(event) => {
        const next = event.currentTarget.checked;
        try { window.localStorage.setItem(MUSCLE_MAP_DEBUG_STORAGE_KEY, String(next)); } catch { /* Optional preference. */ }
        window.dispatchEvent(new Event(eventName));
      }} type="checkbox" />
      <span><span className="block">Muskelkarten-Debug aktivieren</span><span className="mt-0.5 block text-xs font-normal text-[var(--muted)]">Zeigt Rasterpunkte und Trefferdiagnose. Standardmäßig aus.</span></span>
    </label>
  );
}
