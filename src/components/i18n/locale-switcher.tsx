"use client";

import { useLocale } from "./locale-provider";

export function LocaleSwitcher() {
  const { locale, dictionary, setLocale } = useLocale();
  return <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-bold text-[var(--muted)]"><span className="hidden xl:inline">{dictionary.language}</span><select aria-label={dictionary.language} className="min-h-8 rounded-lg border-0 bg-transparent px-1.5 text-sm font-bold text-[var(--foreground)] outline-none" onChange={(event) => setLocale(event.target.value as "de" | "en")} value={locale}><option value="de">{dictionary.languageGerman}</option><option value="en">{dictionary.languageEnglish}</option></select></label>;
}
