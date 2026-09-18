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
  readonly collapsed?: boolean;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/exercises" && pathname.startsWith("/exercises/ai-drafts")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNavigation({ variant, collapsed = false }: PrimaryNavigationProps) {
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
    <nav aria-label="Hauptnavigation" className={`flex-1 space-y-1 ${collapsed ? "p-2" : "p-4"}`}>
      {navigation.map(([label, href]) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
                aria-label={label}
            className={`rounded-lg py-2.5 text-sm font-semibold transition ${collapsed ? "mx-auto flex size-12 items-center justify-center px-0" : "block px-3"} ${
              active
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]"
            }`}
            href={href}
            key={href}
          >
            {collapsed ? <NavIcon label={label} /> : label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ label }: { readonly label: string }) {
  const paths: Record<string, string> = {
    Übersicht: "M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5v-9Z",
    Training: "m8 5 11 7-11 7V5Zm-5 0v14",
    Übungen: "M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Zm3 0v15M8 8h8M8 12h8M8 16h5",
    "AI-Entwürfe": "m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Zm6 13 .7 2.3L21 19l-2.3.7L18 22l-.7-2.3L15 19l2.3-.7L18 16Z",
    Hindernisse: "M4 20 12 4l8 16m-13-5h10M8 13h8",
    Gruppen: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm5-6.5a3 3 0 0 1 0 5.8M18 20v-1.5a3.5 3.5 0 0 0-2-3.2",
    Medien: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13ZM7 16l3.5-4 2.5 3 1.8-2.2L18 16M8 8.5h.01",
  };
  return <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d={paths[label] ?? "M12 5v14M5 12h14"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}
