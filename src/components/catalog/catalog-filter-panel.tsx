import Link from "next/link";
import { FilterSidePanel } from "@/components/layout/filter-side-panel";
import { buttonClass } from "@/components/ui/form";

export function CatalogFilterPanel({
  title,
  resetHref,
  hasFilters,
  children,
}: {
  readonly title: string;
  readonly resetHref: string;
  readonly hasFilters: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <FilterSidePanel title={title}>
      <form className="grid min-w-0 gap-3" method="get">
        {children}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button className={buttonClass("primary", "flex-1")} type="submit">Filtern</button>
          {hasFilters ? <Link className={buttonClass("secondary", "flex-1")} href={resetHref}>Zurücksetzen</Link> : null}
        </div>
      </form>
    </FilterSidePanel>
  );
}

export function CatalogPageSize({
  value,
  options = [20, 40, 80],
}: {
  readonly value: number;
  readonly options?: readonly number[];
}) {
  return <label className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-[var(--muted)]">Pro Seite<select className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-normal text-[var(--foreground)]" defaultValue={String(value)} name="size"><option disabled value="">Auswahl</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
