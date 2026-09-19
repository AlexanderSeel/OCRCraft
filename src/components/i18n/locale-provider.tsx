"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { getDictionary, isLocale, type Locale, type UiDictionary } from "@/i18n/dictionaries";

const STORAGE_KEY = "ocrcraft-locale";
interface LocaleContextValue { readonly locale: Locale; readonly dictionary: UiDictionary; readonly setLocale: (locale: Locale) => void; }
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { readonly children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeToLocale, readLocale, (): Locale => "de");
  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dataset.locale = locale; }, [locale]);
  function setLocale(next: Locale) { window.localStorage.setItem(STORAGE_KEY, next); window.dispatchEvent(new Event("ocrcraft-locale-change")); }
  const value = useMemo(() => ({ locale, dictionary: getDictionary(locale), setLocale }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function readLocale(): Locale {
  if (typeof window === "undefined") return "de";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isLocale(stored) ? stored : "de";
}

function subscribeToLocale(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("ocrcraft-locale-change", onChange);
  return () => { window.removeEventListener("storage", onChange); window.removeEventListener("ocrcraft-locale-change", onChange); };
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider.");
  return value;
}
