"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";

const STORAGE_KEY = "ocrcraft-sidebar-collapsed";

export function CollapsibleSidebar() {
  const storedCollapsed = useSyncExternalStore(
    () => () => undefined,
    () => window.localStorage.getItem(STORAGE_KEY) === "1",
    () => false,
  );
  const [collapsed, setCollapsed] = useState(storedCollapsed);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside className={`hidden border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:overscroll-contain ${collapsed ? "lg:w-[72px]" : "lg:w-[240px]"}`}>
      <div className={`flex h-20 items-center border-b border-[var(--sidebar-border)] ${collapsed ? "justify-center px-2" : "gap-3 px-6"}`}>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-lg font-black text-[var(--accent-foreground)]">O</div>
        {!collapsed ? <div><div className="font-black tracking-tight">OCRCraft</div><div className="text-xs text-[var(--sidebar-muted)]">Club Training Studio</div></div> : null}
      </div>
      <div className={`flex ${collapsed ? "justify-center p-2" : "justify-end px-4 pt-3"}`}>
        <button aria-label={collapsed ? "Hauptnavigation vergrößern" : "Hauptnavigation verkleinern"} className="grid size-10 place-items-center rounded-lg text-lg font-black text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]" onClick={toggle} title={collapsed ? "Navigation vergrößern" : "Navigation verkleinern"} type="button">
          {collapsed ? "›" : "‹"}
        </button>
      </div>
      <PrimaryNavigation collapsed={collapsed} variant="sidebar" />
      <div className={`mt-auto border-t border-[var(--sidebar-border)] ${collapsed ? "space-y-2 p-2" : "space-y-1 p-4"}`}>
        <Link aria-label="Outdoor-Varianten" className={`block rounded-lg py-2.5 text-sm font-semibold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)] ${collapsed ? "text-center" : "px-3"}`} href="/admin/outdoor-variants" title="Outdoor-Varianten">{collapsed ? "◇" : "Outdoor-Varianten"}</Link>
        <Link aria-label="Administration" className={`block rounded-lg py-2.5 text-sm font-semibold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)] ${collapsed ? "text-center" : "px-3"}`} href="/admin?tab=overview" title="Administration">{collapsed ? "⚙" : "Administration"}</Link>
      </div>
    </aside>
  );
}
