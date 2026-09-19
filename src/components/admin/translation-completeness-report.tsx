import type { DictionaryCompletenessReport } from "@/i18n/dictionary-completeness";

export function TranslationCompletenessReport({ report }: { readonly report: DictionaryCompletenessReport }) {
  return (
    <section aria-labelledby="translation-completeness-heading" className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Internationalisierung</div>
          <h3 className="mt-1 text-lg font-black" id="translation-completeness-heading">UI-Übersetzungen</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Geprüft werden die strukturellen Schlüssel der lokalen UI-Dictionaries. Fachseiten werden erst als vollständig bewertet, wenn sie ebenfalls über diese Schlüssel laufen.</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${report.complete ? "bg-[var(--success-bg)] text-[var(--success-foreground)]" : "bg-[var(--warning-bg)] text-[var(--warning)]"}`}>{report.complete ? "Schlüssel vollständig" : "Prüfung offen"}</span>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        <div><div className="text-xs text-[var(--muted)]">Sprachen</div><div className="font-black">{report.locales.join(" · ")}</div></div>
        <div><div className="text-xs text-[var(--muted)]">Gemeinsame Schlüssel</div><div className="font-black">{report.keys}</div></div>
        <div><div className="text-xs text-[var(--muted)]">Status</div><div className="font-black">{report.complete ? "Keine strukturellen Lücken" : "Lücken gefunden"}</div></div>
      </div>
      {!report.complete ? <div className="mt-3 grid gap-2 text-xs text-[var(--danger)]">{report.locales.map((locale) => report.missingByLocale[locale].length > 0 ? <p key={`missing-${locale}`}>{locale}: fehlend – {report.missingByLocale[locale].join(", ")}</p> : null)}{report.locales.map((locale) => report.orphanByLocale[locale].length > 0 ? <p key={`orphan-${locale}`}>{locale}: verwaist – {report.orphanByLocale[locale].join(", ")}</p> : null)}</div> : null}
    </section>
  );
}
