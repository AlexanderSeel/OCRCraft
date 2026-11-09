"use client";

import { useEffect, useSyncExternalStore } from "react";
import { RouteErrorContent } from "@/components/navigation/route-states";
import { getDictionary, isLocale, type Locale } from "@/i18n/dictionaries";
import "./globals.css";

function readLocale() {
  try { const value = localStorage.getItem("ocrcraft-locale"); return isLocale(value) ? value : "de"; }
  catch { return "de"; }
}
const subscribe = () => () => undefined;

export default function GlobalError({ retry }: { readonly retry: () => void }) {
  const locale = useSyncExternalStore<Locale>(subscribe, readLocale, () => "de");
  const dictionary = getDictionary(locale);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ocrcraft-theme");
      const theme = stored === "light" || stored === "dark" ? stored : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch { /* Recovery remains usable when browser storage is unavailable. */ }
  }, []);
  return <html lang={locale}><head><title>{dictionary.routeStates.error} · OCRCraft</title></head><body><RouteErrorContent dictionary={dictionary} retry={retry} /></body></html>;
}
