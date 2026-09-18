import Link from "next/link";

export const ADMIN_TABS = [
  ["overview", "Übersicht"],
  ["database", "Datenbank"],
  ["quality", "Datenqualität"],
  ["queue", "Aufgabenqueue"],
  ["users", "Benutzer & Profile"],
  ["settings", "Einstellungen"],
  ["outdoor", "Outdoor-Varianten"],
] as const;

export type AdminTab = (typeof ADMIN_TABS)[number][0];

export function normalizeAdminTab(value?: string): AdminTab {
  return ADMIN_TABS.some(([id]) => id === value) ? (value as AdminTab) : "overview";
}

export function AdminTabs({ active }: { readonly active: AdminTab }) {
  return (
    <nav aria-label="Administrationsbereiche" className="-mb-px flex gap-1 overflow-x-auto border-b border-[var(--border)]" role="tablist">
      {ADMIN_TABS.map(([id, label]) => (
        <Link
          aria-current={active === id ? "page" : undefined}
          className={`min-h-11 shrink-0 border-b-2 px-3 py-2.5 text-sm font-black transition-colors ${
            active === id
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
          }`}
          href={id === "outdoor" ? "/admin/outdoor-variants" : `/admin?tab=${id}`}
          key={id}
          role="tab"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
