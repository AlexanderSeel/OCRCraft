"use client";

import type { ReactNode } from "react";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { CollapsibleSidebar } from "@/components/layout/collapsible-sidebar";
import { QueueStatusIndicator } from "@/components/queue-status-indicator";
import { FormValidation } from "@/components/forms/form-validation";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useLocale } from "@/components/i18n/locale-provider";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { GuidedTour } from "@/components/onboarding/guided-tour";
import type { BreadcrumbSection } from "@/components/navigation/breadcrumbs";

interface AppShellClientProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly currentUser: { readonly displayName: string; readonly role: string };
  readonly breadcrumbSection?: BreadcrumbSection;
}

export function AppShellClient({ title, subtitle, actions, children, currentUser, breadcrumbSection }: AppShellClientProps) {
  const { dictionary } = useLocale();
  const roleLabel = currentUser.role === "super_admin" ? "Super-Admin" : currentUser.role === "admin" ? "Admin" : "Trainer";
  const initials = currentUser.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return <div className="app-shell min-h-screen lg:flex lg:h-dvh lg:min-h-0 lg:overflow-hidden">
    <a className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[2147482000] focus:rounded-md focus:bg-[var(--control-strong)] focus:px-3 focus:py-2.5 focus:text-sm focus:font-black focus:text-[var(--control-strong-foreground)]" href="#main-content">{dictionary.skipToContent}</a>
    <CollapsibleSidebar />
    <div className="min-w-0 flex-1 lg:h-dvh lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
      <header className="app-header sticky top-0 z-20 border-b border-[var(--border)] backdrop-blur">
        <div className="mx-auto max-w-[1680px] px-3 py-2 sm:px-4 lg:px-5">
          <div className="flex min-h-7 min-w-0 items-center justify-between gap-3">
            <Breadcrumbs current={title} section={breadcrumbSection} />
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <span className="grid size-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] text-xs font-black sm:hidden" title={`${currentUser.displayName} · ${roleLabel}`} aria-label={`Angemeldet: ${currentUser.displayName} · ${roleLabel}`}>{initials}</span>
              <span className="hidden max-w-64 truncate rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-bold text-[var(--muted)] sm:inline-flex" title={currentUser.displayName}>{currentUser.displayName} · {roleLabel}</span>
              <GuidedTour />
              <LocaleSwitcher />
              <QueueStatusIndicator />
            </div>
          </div>
          <div className="mt-1 flex min-w-0 flex-wrap items-end justify-between gap-2 sm:mt-1.5">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-[-0.025em] sm:text-[1.45rem]">{title}</h1>
              {subtitle ? <p className="mt-0.5 hidden truncate text-sm text-[var(--muted)] sm:block">{subtitle}</p> : null}
            </div>
            {actions ? <div aria-label={dictionary.pageActions} className="flex flex-wrap items-center justify-end gap-1.5">{actions}</div> : null}
          </div>
        </div>
        <PrimaryNavigation variant="mobile" />
      </header>
      <main className="app-main mx-auto max-w-[1680px] p-3 sm:p-4 lg:p-5" data-tour="page-content" id="main-content" tabIndex={-1}>
        <FormValidation />
        {children}
      </main>
    </div>
  </div>;
}
