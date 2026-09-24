export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export interface UiDictionary {
  readonly navigation: { readonly overview: string; readonly training: string; readonly exercises: string; readonly games: string; readonly aiDrafts: string; readonly obstacles: string; readonly outdoor: string; readonly groups: string; readonly media: string };
  readonly language: string;
  readonly languageGerman: string;
  readonly languageEnglish: string;
  readonly appearance: string;
  readonly themeSystem: string;
  readonly themeLight: string;
  readonly themeDark: string;
  readonly skipToContent: string;
  readonly pageActions: string;
  readonly breadcrumbLabel: string;
  readonly mobileNavigation: string;
  readonly navigationLabel: string;
  readonly help: string;
  readonly version: string;
  readonly tourClose: string;
  readonly tourPrevious: string;
  readonly tourNext: string;
  readonly tourFinish: string;
  readonly tourSkip: string;
  readonly tourStep: string;
}

export const dictionaries: Readonly<Record<Locale, UiDictionary>> = {
  de: {
    navigation: { overview: "Dashboard", training: "Training", exercises: "Übungen", games: "Spiele", aiDrafts: "AI-Entwürfe", obstacles: "Hindernisse", outdoor: "Outdoor", groups: "Gruppen", media: "Medien" },
    language: "Sprache", languageGerman: "Deutsch", languageEnglish: "English", appearance: "Darstellung", themeSystem: "System", themeLight: "Hell", themeDark: "Dunkel", skipToContent: "Zum Hauptinhalt springen", pageActions: "Seitenaktionen", breadcrumbLabel: "Brotkrümelnavigation", mobileNavigation: "Hauptnavigation mobil", navigationLabel: "Hauptnavigation", help: "Tutorial öffnen", version: "Version", tourClose: "Tutorial schließen", tourPrevious: "Zurück", tourNext: "Weiter", tourFinish: "Fertig", tourSkip: "Überspringen", tourStep: "Schritt",
  },
  en: {
    navigation: { overview: "Dashboard", training: "Training", exercises: "Exercises", games: "Games", aiDrafts: "AI drafts", obstacles: "Obstacles", outdoor: "Outdoor", groups: "Groups", media: "Media" },
    language: "Language", languageGerman: "German", languageEnglish: "English", appearance: "Appearance", themeSystem: "System", themeLight: "Light", themeDark: "Dark", skipToContent: "Skip to main content", pageActions: "Page actions", breadcrumbLabel: "Breadcrumb navigation", mobileNavigation: "Mobile main navigation", navigationLabel: "Main navigation", help: "Open tutorial", version: "Version", tourClose: "Close tutorial", tourPrevious: "Back", tourNext: "Next", tourFinish: "Done", tourSkip: "Skip", tourStep: "Step",
  },
};

export function isLocale(value: string | null | undefined): value is Locale { return value === "de" || value === "en"; }
export function getDictionary(locale: Locale): UiDictionary { return dictionaries[locale]; }
