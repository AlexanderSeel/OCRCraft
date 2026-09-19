import Link from "next/link";

export function CatalogResultCount({
  from,
  to,
  total,
  label,
}: {
  readonly from: number;
  readonly to: number;
  readonly total: number;
  readonly label: string;
}) {
  return <span aria-live="polite">{total === 0 ? "0" : `${from}–${to}`} von {total} {label}</span>;
}

export function CatalogPagination({
  page,
  totalPages,
  href,
  label,
}: {
  readonly page: number;
  readonly totalPages: number;
  readonly href: (page: number) => string;
  readonly label: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={`Seitennavigation ${label}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
      <span className="text-[var(--muted)]">Seite {page} von {totalPages}</span>
      <div className="flex flex-wrap gap-2">
        {page > 1 ? <Link className="rounded-md border border-[var(--border)] px-3 py-2 font-bold hover:bg-[var(--surface-subtle)]" href={href(page - 1)}>Zurück</Link> : null}
        {page < totalPages ? <Link className="rounded-md bg-[var(--brand)] px-3 py-2 font-bold text-[var(--brand-foreground)] hover:bg-[var(--brand-strong)]" href={href(page + 1)}>Weiter</Link> : null}
      </div>
    </nav>
  );
}
