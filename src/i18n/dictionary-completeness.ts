import { dictionaries, type Locale } from "./dictionaries";

export interface DictionaryCompletenessReport {
  readonly locales: readonly Locale[];
  readonly keys: number;
  readonly missingByLocale: Readonly<Record<Locale, readonly string[]>>;
  readonly orphanByLocale: Readonly<Record<Locale, readonly string[]>>;
  readonly complete: boolean;
}

function leafKeys(value: unknown, prefix = ""): readonly string[] {
  if (value == null || typeof value !== "object") return prefix ? [prefix] : [];
  return Object.entries(value).flatMap(([key, nested]) => leafKeys(nested, prefix ? `${prefix}.${key}` : key));
}

export function getDictionaryCompletenessReport(): DictionaryCompletenessReport {
  const locales = Object.keys(dictionaries) as Locale[];
  const keysByLocale = Object.fromEntries(locales.map((locale) => [locale, new Set(leafKeys(dictionaries[locale]))])) as Record<Locale, Set<string>>;
  const allKeys = new Set(locales.flatMap((locale) => [...keysByLocale[locale]]));
  const missingByLocale = Object.fromEntries(locales.map((locale) => [locale, [...allKeys].filter((key) => !keysByLocale[locale].has(key)).sort()])) as unknown as Record<Locale, readonly string[]>;
  const orphanByLocale = Object.fromEntries(locales.map((locale) => [locale, [...keysByLocale[locale]].filter((key) => locales.some((other) => other !== locale && !keysByLocale[other].has(key))).sort()])) as unknown as Record<Locale, readonly string[]>;
  return { locales, keys: allKeys.size, missingByLocale, orphanByLocale, complete: locales.every((locale) => missingByLocale[locale].length === 0 && orphanByLocale[locale].length === 0) };
}
