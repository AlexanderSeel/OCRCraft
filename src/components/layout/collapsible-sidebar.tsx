"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { APP_RELEASE_LABEL } from "@/config/app-version";

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
    <aside className={`hidden shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-[width] lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:overscroll-contain ${collapsed ? "lg:w-[64px]" : "lg:w-[224px]"}`}>
      <div className={`flex h-16 items-center border-b border-[var(--sidebar-border)] ${collapsed ? "justify-center px-2" : "gap-2.5 px-3"}`}>
        <div className="brand-mark grid size-9 shrink-0 place-items-center text-base font-black">O</div>
        {!collapsed ? <div className="min-w-0"><div className="truncate font-black tracking-[-0.02em]">OCRCraft</div><div className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--sidebar-muted)]">Build · Train · Progress</div></div> : null}
        {!collapsed ? <button aria-label="Hauptnavigation verkleinern" className="ml-auto grid size-10 shrink-0 place-items-center rounded-md text-lg font-black text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]" onClick={toggle} title="Navigation verkleinern" type="button">‹</button> : null}
      </div>
      {collapsed ? <div className="flex justify-center border-b border-[var(--sidebar-border)] p-1.5"><button aria-label="Hauptnavigation vergrößern" className="grid size-10 place-items-center rounded-md text-lg font-black text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]" onClick={toggle} title="Navigation vergrößern" type="button">›</button></div> : null}
      <PrimaryNavigation collapsed={collapsed} variant="sidebar" />
      <div className={`mt-auto border-t border-[var(--sidebar-border)] ${collapsed ? "p-1.5" : "p-2.5"}`}>
        <Link aria-label="Administration" className={`min-h-11 rounded-md text-sm font-semibold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)] ${collapsed ? "mx-auto flex size-11 items-center justify-center" : "flex items-center gap-3 px-3"}`} data-tour="nav-admin" href="/admin?tab=overview" title="Administration">
          <svg aria-hidden="true" className="size-5 shrink-0" fill="none" viewBox="0 0 24 24"><path d="M12 3.5 13.4 5l2-.2.8 1.8 1.8.8-.2 2L19.5 11l-1.4 1.5 1.4 1.5-1.7 1.6.2 2-1.8.8-.8 1.8-2-.2L12 21l-1.5-1.4-2 .2-.8-1.8-1.8-.8.2-2L4.5 14l1.4-1.5L4.5 11l1.6-1.6-.2-2 1.8-.8.8-1.8 2 .2L12 3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" /><circle cx="12" cy="12.5" r="2.5" stroke="currentColor" strokeWidth="1.6" /></svg>
          {!collapsed ? <span>Administration</span> : null}
        </Link>
        <Link aria-label="Hilfezentrum" className={`mt-0.5 min-h-11 rounded-md text-sm font-semibold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)] ${collapsed ? "mx-auto flex size-11 items-center justify-center" : "flex items-center gap-3 px-3"}`} href="/help" title="Hilfezentrum">
          <svg aria-hidden="true" className="size-5 shrink-0" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" /><path d="M9.8 9.2a2.4 2.4 0 1 1 3.7 2c-.9.6-1.5 1.1-1.5 2.3M12 17h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>
          {!collapsed ? <span>Hilfezentrum</span> : null}
        </Link>
        {!collapsed ? <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--sidebar-muted)]">{APP_RELEASE_LABEL}</div> : null}
      </div>
    </aside>
  );
}
