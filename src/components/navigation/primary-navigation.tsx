"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  ["Übersicht", "/"],
  ["Training", "/training"],
  ["Übungen", "/exercises"],
  ["AI-Entwürfe", "/exercises/ai-drafts"],
  ["Hindernisse", "/obstacles"],
  ["Gruppen", "/groups"],
  ["Medien", "/media"],
] as const;

interface PrimaryNavigationProps {
  readonly variant: "sidebar" | "mobile";
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/exercises" && pathname.startsWith("/exercises/ai-drafts")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNavigation({ variant }: PrimaryNavigationProps) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav aria-label="Hauptnavigation mobil" className="overflow-x-auto border-t border-[var(--border)] lg:hidden">
        <div className="mx-auto flex min-w-max max-w-[1500px] gap-1 px-4 py-2 sm:px-6">
          {navigation.map(([label, href]) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold transition ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--foreground)] ring-1 ring-[var(--accent-strong)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"
                }`}
                href={href}
                key={href}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Hauptnavigation" className="flex-1 space-y-1 p-4">
      {navigation.map(([label, href]) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]"
            }`}
            href={href}
            key={href}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
