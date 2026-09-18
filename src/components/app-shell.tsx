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
          <details className="group mx-auto max-w-[1500px]">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-2 marker:hidden sm:px-6 lg:px-8">
              <span className="min-w-0">
                <span className="block truncate text-xl font-black tracking-tight sm:text-2xl">{title}</span>
                {subtitle ? <span className="mt-1 hidden truncate text-sm text-[var(--muted)] sm:block">{subtitle}</span> : null}
              </span>
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--border)] text-lg font-black transition-transform group-open:rotate-180">⌄</span>
              <span className="sr-only">Seitenkopf ein- oder ausklappen</span>
            </summary>
            {actions ? <div aria-label="Seitenaktionen" className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] px-4 py-2 sm:px-6 lg:px-8">{actions}</div> : null}
          </details>
          <PrimaryNavigation variant="mobile" />
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
