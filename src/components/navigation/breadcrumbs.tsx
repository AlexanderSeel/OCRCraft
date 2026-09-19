"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";

const navigation = [
  ["/training", "training"],
  ["/exercises", "exercises"],
  ["/games", "games"],
  ["/obstacles", "obstacles"],
  ["/groups", "groups"],
  ["/media", "media"],
] as const;

export function Breadcrumbs({ current }: { readonly current: string }) {
  const pathname = usePathname();
  const { dictionary } = useLocale();
  if (pathname === "/") return null;

  const parent = navigation.find(([href]) => pathname === href || pathname.startsWith(`${href}/`));
  const parentLabel = parent ? dictionary.navigation[parent[1]] : dictionary.navigation.overview;
  return (
    <nav aria-label={dictionary.breadcrumbLabel} className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-[11px] font-bold text-[var(--muted)]">
        <li><Link className="rounded-sm px-1 py-0.5 hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]" href="/">{dictionary.navigation.overview}</Link></li>
        <li aria-hidden="true" className="text-[var(--border-strong)]">›</li>
        <li className="min-w-0 truncate text-[var(--foreground)]" aria-current="page">
          {parent && pathname !== parent[0] ? <><Link className="hover:underline" href={parent[0]}>{parentLabel}</Link><span aria-hidden="true" className="px-1 text-[var(--border-strong)]">›</span></> : null}
          {current}
        </li>
      </ol>
    </nav>
  );
}
