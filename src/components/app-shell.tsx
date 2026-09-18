import type { ReactNode } from "react";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { CollapsibleSidebar } from "@/components/layout/collapsible-sidebar";

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
          <PrimaryNavigation variant="mobile" />
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
