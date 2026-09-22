import type { CatalogCoverageReport } from "@/server/exercises/catalog-coverage-core";

export function CatalogCoverageReportView({ report }: { readonly report: CatalogCoverageReport }) {
  return (
    <section aria-labelledby="catalog-coverage-heading" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Katalog-Coverage</div>
          <h2 className="mt-1 text-xl font-black" id="catalog-coverage-heading">Abdeckung der Planungsdimensionen</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Zeigt strukturierte Null- und Lückenstellen im aktiven Katalog. Club-Hindernisse werden nur innerhalb der OCRFRA-Varianten bewertet; fachliche Qualität und Vereinsfreigabe bleiben separate Reviews.</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-black">{report.totalExercises} aktive Übungen</div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {report.dimensions.map((dimension) => (
          <article className={`rounded-xl border p-3 ${dimension.missing === 0 ? "border-[var(--success-border)] bg-[var(--success-bg)]" : "border-[var(--warning)] bg-[var(--warning-bg)]"}`} key={dimension.key}>
            <div className="flex items-center justify-between gap-2"><h3 className="font-black">{dimension.label}</h3><span className="text-sm font-black">{dimension.percent}%</span></div>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{dimension.covered} / {dimension.total} abgedeckt</p>
            <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border)]"><div className="h-full rounded-full bg-[var(--success-foreground)]" style={{ width: `${dimension.percent}%` }} /></div>
            {dimension.examples.length > 0 ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Beispiele: {dimension.examples.join(" · ")}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
