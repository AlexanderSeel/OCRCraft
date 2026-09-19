"use client";

import type { ReactNode } from "react";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { CollapsibleSidebar } from "@/components/layout/collapsible-sidebar";
import { QueueStatusIndicator } from "@/components/queue-status-indicator";
import { FormValidation } from "@/components/forms/form-validation";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useLocale } from "@/components/i18n/locale-provider";

interface AppShellProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const { dictionary } = useLocale();
  return (
    <div className="min-h-screen lg:flex lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2147482000] focus:rounded-lg focus:bg-[var(--control-strong)] focus:px-4 focus:py-3 focus:text-sm focus:font-black focus:text-[var(--control-strong-foreground)]"
        href="#main-content"
      >
        {dictionary.skipToContent}
      </a>
      <CollapsibleSidebar />
      <div className="min-w-0 flex-1 lg:h-dvh lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--header)] backdrop-blur">
          <div className="mx-auto max-w-[1500px] px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">{title}</h1>
              {subtitle ? <p className="mt-1 hidden truncate text-sm text-[var(--muted)] sm:block">{subtitle}</p> : null}
              </div>
              <div className="flex items-center gap-2"><LocaleSwitcher /><QueueStatusIndicator /></div>
            </div>
            {actions ? <div aria-label={dictionary.pageActions} className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
          </div>
          <PrimaryNavigation variant="mobile" />
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8" id="main-content" tabIndex={-1}><FormValidation />{children}</main>
      </div>
    </div>
  );
}
