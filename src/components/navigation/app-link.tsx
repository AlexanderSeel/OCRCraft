"use client";

import NextLink, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/i18n/locale-provider";
import { routeTitle } from "@/config/route-titles";

type Props = ComponentProps<typeof NextLink>;

/** Native Next navigation, with feedback while the current page remains mounted. */
export default function AppLink({ children, href, ...props }: Props) {
  const pathname = typeof href === "string" ? href.split(/[?#]/)[0] : href.pathname ?? "/";
  return <NextLink {...props} href={href}>{children}<NavigationNotice pathname={pathname} /></NextLink>;
}

function NavigationNotice({ pathname }: { readonly pathname: string }) {
  const { pending } = useLinkStatus();
  const { locale } = useLocale();
  if (!pending) return null;
  return createPortal(
    <div role="status" aria-live="polite" aria-atomic="true" data-testid="navigation-loading" className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] shadow-xl print:hidden">
      <span aria-hidden="true" className="size-5 shrink-0 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)] motion-reduce:animate-none" />
      <div className="min-w-0"><p className="text-sm font-black">{locale === "en" ? "Loading…" : "Wird geladen …"}</p><p className="truncate text-xs text-[var(--muted)]">{routeTitle(pathname || "/", locale)}</p></div>
    </div>, document.body,
  );
}
