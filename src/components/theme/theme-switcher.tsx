"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/components/i18n/locale-provider";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "ocrcraft-theme";
const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Hell" },
  { value: "dark", label: "Dunkel" },
];

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function resolveTheme(preference: ThemePreference, media: MediaQueryList): "light" | "dark" {
  return preference === "system" ? (media.matches ? "dark" : "light") : preference;
}

function applyTheme(preference: ThemePreference, media: MediaQueryList) {
  const resolved = resolveTheme(preference, media);
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export function ThemeSwitcher() {
  const { dictionary } = useLocale();
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = isThemePreference(stored) ? stored : "system";

    if (selectRef.current) selectRef.current.value = initial;
    applyTheme(initial, media);

    const handleSystemChange = () => {
      if ((document.documentElement.dataset.themePreference ?? "system") === "system") {
        applyTheme("system", media);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = isThemePreference(event.newValue) ? event.newValue : "system";
      if (selectRef.current) selectRef.current.value = next;
      applyTheme(next, media);
    };

    media.addEventListener("change", handleSystemChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      media.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function changeTheme(next: ThemePreference) {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next, media);
  }

  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-bold text-[var(--muted)]">
      <span className="hidden xl:inline">{dictionary.appearance}</span>
      <select
        data-theme-switcher="true"
        ref={selectRef}
        aria-label="Darstellung"
        className="min-h-8 rounded-sm border-0 bg-transparent px-1.5 text-sm font-bold text-[var(--foreground)] outline-none"
        defaultValue="system"
        onChange={(event) => changeTheme(event.target.value as ThemePreference)}
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value === "system" ? dictionary.themeSystem : option.value === "light" ? dictionary.themeLight : dictionary.themeDark}
          </option>
        ))}
      </select>
    </label>
  );
}
