"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";

const navigation = [
  ["overview", "/"], ["training", "/training"], ["exercises", "/exercises"], ["games", "/games"], ["aiDrafts", "/exercises/ai-drafts"], ["obstacles", "/obstacles"], ["outdoor", "/admin/outdoor-variants"], ["groups", "/groups"], ["media", "/media"],
] as const;

interface PrimaryNavigationProps {
  readonly variant: "sidebar" | "mobile";
  readonly collapsed?: boolean;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/exercises" && pathname.startsWith("/exercises/ai-drafts")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNavigation({ variant, collapsed = false }: PrimaryNavigationProps) {
  const pathname = usePathname();
  const { dictionary } = useLocale();

  if (variant === "mobile") {
    return (
      <nav aria-label={dictionary.mobileNavigation} className="min-w-0 max-w-full overflow-x-auto border-t border-[var(--border)] lg:hidden">
        <div className="mx-auto flex w-max min-w-full max-w-[1680px] gap-0.5 px-3 py-1.5 sm:px-4">
          {navigation.map(([key, href]) => {
            const label = dictionary.navigation[key];
            const active = isActivePath(pathname, href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border-l-2 px-2.5 text-xs font-bold transition ${active ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--foreground)]" : "border-transparent text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"}`}
                href={href}
                key={href}
                data-tour={`nav-${key}`}
              >
                <NavIcon label={key} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label={dictionary.navigationLabel} className={`flex-1 space-y-0.5 ${collapsed ? "p-1.5" : "p-2.5"}`}>
      {navigation.map(([key, href]) => {
        const label = dictionary.navigation[key];
        const active = isActivePath(pathname, href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={`min-h-11 rounded-md border-l-2 text-sm font-semibold transition ${collapsed ? "mx-auto flex size-11 items-center justify-center px-0" : "flex items-center gap-3 px-3"} ${active ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--sidebar-foreground)]" : "border-transparent text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]"}`}
            href={href}
            key={href}
            data-tour={`nav-${key}`}
          >
            <span className={active ? "text-[var(--brand)]" : ""}><NavIcon label={key} /></span>
            {!collapsed ? <span className="truncate">{label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ label }: { readonly label: string }) {
  const paths: Record<string, string> = {
    overview: "M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5v-9Z",
    training: "m8 5 11 7-11 7V5Zm-5 0v14",
    exercises: "M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Zm3 0v15M8 8h8M8 12h8M8 16h5",
    games: "M8 8h8m-9 4h2m6 0h2m-5-7v3m-7.5 9.5 1.4-8.2A4 4 0 0 1 9.8 6h4.4a4 4 0 0 1 3.9 3.3l1.4 8.2a2 2 0 0 1-3.4 1.7L14 17H10l-2.1 2.2a2 2 0 0 1-3.4-1.7Z",
    aiDrafts: "m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Zm6 13 .7 2.3L21 19l-2.3.7L18 22l-.7-2.3L15 19l2.3-.7L18 16Z",
    obstacles: "M4 20 12 4l8 16m-13-5h10M8 13h8",
    outdoor: "M12 3v18m-7-7 7-7 7 7M5 20h14",
    groups: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm5-6.5a3 3 0 0 1 0 5.8M18 20v-1.5a3.5 3.5 0 0 0-2-3.2",
    media: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13ZM7 16l3.5-4 2.5 3 1.8-2.2L18 16M8 8.5h.01",
  };
  return <svg aria-hidden="true" className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d={paths[label] ?? "M12 5v14M5 12h14"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}
