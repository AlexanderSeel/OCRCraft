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
    <aside className={`hidden shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-[width] lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:overscroll-contain ${collapsed ? "lg:w-[72px]" : "lg:w-[240px]"}`}>
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
        <Link aria-label="Outdoor-Varianten" className={`rounded-lg py-2.5 text-sm font-semibold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)] ${collapsed ? "mx-auto flex size-12 items-center justify-center" : "block px-3"}`} href="/admin/outdoor-variants" title="Outdoor-Varianten">{collapsed ? <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24"><path d="M4 20 12 4l8 16m-13-5h10M8 13h8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg> : "Outdoor-Varianten"}</Link>
        <Link aria-label="Administration" className={`rounded-lg py-2.5 text-sm font-semibold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)] ${collapsed ? "mx-auto flex size-12 items-center justify-center" : "block px-3"}`} href="/admin?tab=overview" title="Administration">{collapsed ? <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24"><path d="M12 3.5 13.4 5l2-.2.8 1.8 1.8.8-.2 2L19.5 11l-1.4 1.5 1.4 1.5-1.7 1.6.2 2-1.8.8-.8 1.8-2-.2L12 21l-1.5-1.4-2 .2-.8-1.8-1.8-.8.2-2L4.5 14l1.4-1.5L4.5 11l1.6-1.6-.2-2 1.8-.8.8-1.8 2 .2L12 3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" /><circle cx="12" cy="12.5" r="2.5" stroke="currentColor" strokeWidth="1.6" /></svg> : "Administration"}</Link>
      </div>
    </aside>
  );
}
