import Link from "next/link";
import type { ReactNode } from "react";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { CollapsibleSidebar } from "@/components/layout/collapsible-sidebar";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { TrainingBuilderResumeLink } from "@/components/training/training-builder-resume-link";

interface AppShellProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  return (
    <div className="min-h-screen lg:flex lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <CollapsibleSidebar />
      <div className="min-w-0 flex-1 lg:h-dvh lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--header)] backdrop-blur">
          <div className="mx-auto flex min-h-20 max-w-[1500px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">{title}</h1>
              {subtitle ? <p className="mt-1 hidden text-sm text-[var(--muted)] sm:block">{subtitle}</p> : null}
            </div>
            {actions ? <div aria-label="Seitenaktionen" className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
          </div>
          <div className="border-t border-[var(--border)]/70 bg-[var(--surface-subtle)]/40">
            <div aria-label="Globale Werkzeuge" className="mx-auto flex min-h-10 max-w-[1500px] flex-wrap items-center justify-end gap-2 px-4 py-1.5 sm:px-6 lg:px-8">
              <span className="mr-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">System</span>
              <TrainingBuilderResumeLink />
              <ThemeSwitcher />
              <nav aria-label="Schnellzugriff" className="flex items-center gap-1">
                <Link className="inline-flex min-h-9 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-black hover:bg-[var(--surface-subtle)]" href="/admin?tab=overview">
                  Administration
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
