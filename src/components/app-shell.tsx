import Link from "next/link";
import type { ReactNode } from "react";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

interface AppShellProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] lg:flex lg:min-h-screen lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-[var(--sidebar-border)] px-6">
          <div className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-lg font-black text-[var(--accent-foreground)]">O</div>
          <div>
            <div className="font-black tracking-tight">OCRCraft</div>
            <div className="text-xs text-[var(--sidebar-muted)]">Club Training Studio</div>
          </div>
        </div>
        <PrimaryNavigation variant="sidebar" />
        <div className="border-t border-[var(--sidebar-border)] p-4">
          <Link className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]" href="/admin#database-settings">
            Einstellungen
          </Link>
          <Link className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]" href="/admin">
            Administration
          </Link>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--header)] backdrop-blur">
          <div className="mx-auto flex min-h-20 max-w-[1500px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">{title}</h1>
              {subtitle ? <p className="mt-1 hidden text-sm text-[var(--muted)] sm:block">{subtitle}</p> : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
              <ThemeSwitcher />
              <nav aria-label="Schnellzugriff" className="flex items-center gap-1">
                <Link className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-xs font-bold text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] sm:px-3 sm:text-sm" href="/admin#database-settings">
                  <span className="sm:hidden">Setup</span><span className="hidden sm:inline">Einstellungen</span>
                </Link>
                <Link className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-black hover:bg-[var(--surface-subtle)] sm:px-3 sm:text-sm" href="/admin">
                  <span className="sm:hidden">Admin</span><span className="hidden sm:inline">Administration</span>
                </Link>
              </nav>
            </div>
          </div>
          <PrimaryNavigation variant="mobile" />
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
