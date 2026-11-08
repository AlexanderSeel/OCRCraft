import type { ClubVenueId } from "@/domain/training/club-venues";

export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export interface UiDictionary {
  readonly venues: { readonly title: string; readonly none: string; readonly help: string; readonly court: string; readonly track: string; readonly unknown: string; readonly indoorConflict: string; readonly planningWarning: string; readonly names: Readonly<Record<ClubVenueId, string>> };
  readonly navigation: { readonly overview: string; readonly training: string; readonly exercises: string; readonly games: string; readonly aiDrafts: string; readonly obstacles: string; readonly outdoor: string; readonly groups: string; readonly media: string };
  readonly seedReviewEvidence: { readonly title: string; readonly versioned: string; readonly compatibility: string; readonly needsWork: string; readonly missing: string; readonly explanation: string };
  readonly planningEligibility: { readonly noCandidates: string; readonly title: string; readonly description: string };
  readonly recovery: { readonly saving: string; readonly found: string; readonly restore: string; readonly discard: string; readonly stored: string; readonly restored: string; readonly unavailable: string; readonly review: string };
  readonly trainingOverview: { readonly title: string; readonly audience: string; readonly age: string; readonly unknown: string; readonly planned: string; readonly target: string; readonly minutes: string; readonly kids: string; readonly youth: string; readonly adults: string; readonly mixed: string; readonly warmup: string; readonly main: string; readonly cooldown: string };
  readonly trainingValidation: {
    readonly created: string; readonly review: string;
    readonly clear: string; readonly errors: string; readonly warnings: string;
    readonly blocked: string; readonly recommendations: string;
  };
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
  readonly dialogClose: string;
  readonly close: string;
  readonly tourClose: string;
  readonly tourPrevious: string;
  readonly tourNext: string;
  readonly tourFinish: string;
  readonly tourSkip: string;
  readonly tourStep: string;
  readonly tourLocate: string;
}

export const dictionaries: Readonly<Record<Locale, UiDictionary>> = {
  de: {
    venues: { indoorConflict: "Das gewählte Vereinsgelände liegt im Freien. Wähle Outdoor oder entferne die Geländewahl.", title: "Vereinsgelände", none: "Kein bestimmtes Gelände", help: "Die Geländewahl setzt die Planung auf Outdoor. Ausrüstung und verfügbare Hindernisse separat angeben.", court: "Gesamtfläche 40 × 20 m, Kunstrasen. Nutzbare Teilfläche, Auslauf und zulässige Belastungen sind noch nicht erfasst; daraus wird keine Shuttlelänge abgeleitet.", track: "Feld mit 400-m-Laufbahn. Bahnbreite, Zugänge, Übergänge und aktuelle Belegung sind noch nicht erfasst.", unknown: "Fläche bekannt, Maße und Untergrund noch nicht erfasst. Laufwege und Sicherheitsabstände vor Ort festlegen.", planningWarning: "Geländeprofil ist keine Flächen-/Sicherheitsfreigabe. Nutzbare Fläche, Belegung, Wetter, Laufwege, Aufsicht und Geräte vor Ort prüfen; Laufvolumen und Laufzeit sind noch nicht automatisch nachgewiesen.", names: { "large-field": "Großes Feld", "obstacle-area": "Hindernisbereich", "synthetic-court": "Kunstrasenplatz · 40 × 20 m", "athletics-field": "Feld mit 400-m-Laufbahn" } },
    seedReviewEvidence: { title: "Review-Nachweise der Seeds", versioned: "Versionierte Revieweinträge", compatibility: "Kompatibilitätsmarkierungen", needsWork: "Nachbearbeitung / unklare Nachweise", missing: "Ohne Revieweintrag", explanation: "Kompatibilitätsmarkierungen wurden automatisch nachgetragen und sind keine fachliche Freigabe. Vollständige Felder und versionierte Revieweinträge ersetzen ebenfalls keine Prüfung des aktuellen Inhalts und seiner Bilder." },
    planningEligibility: { noCandidates: "Für diese Planung sind keine Übungen mit passenden, vollständigen Basisangaben verfügbar. Prüfe Alter, Ausrüstung, Einschränkungen und die Katalogangaben. Es wurde kein Trainingsvorschlag erstellt.", title: "Welche Übungen werden automatisch geplant?", description: "Für automatische Vorschläge müssen Mindestalter, Zielgruppen- und Ortsangaben, Risiko, Stationskapazität, Trainingsziele und Bewegungsmuster hinterlegt sein. Einträge mit fehlenden Basisangaben bleiben im Katalog zur Nachbearbeitung erhalten. Das ersetzt keine fachliche Prüfung und Freigabe." },
    recovery: { saving: "Lokale Planung wird gesichert …", found: "Lokale Planung gefunden", restore: "Planung wiederherstellen", discard: "Lokale Planung verwerfen", stored: "Planung auf diesem Gerät gesichert", restored: "Planung wiederhergestellt", unavailable: "Lokale Sicherung nicht verfügbar. Deine aktuellen Eingaben bleiben nutzbar.", review: "Gesichert werden die Planungseingaben. Erstelle danach einen neuen Entwurf und prüfe ihn vor dem Speichern. Ein Training wird dadurch nicht automatisch gespeichert oder freigegeben." },
    trainingOverview: { title: "Trainingsübersicht", audience: "Zielgruppe", age: "Alter", unknown: "Nicht hinterlegt", planned: "Geplant", target: "Ziel", minutes: "Min.", kids: "Kinder", youth: "Jugend", adults: "Erwachsene", mixed: "Gemischt", warmup: "Aufwärmen", main: "Hauptteil", cooldown: "Cooldown & Stretching" },
    trainingValidation: { created: "Trainingsentwurf erstellt", review: "Prüfe den Entwurf und seine Hinweise, bevor du ihn speicherst.", clear: "Plan-Check ohne Hinweise", errors: "Fehler", warnings: "Hinweise", blocked: "Vor dem Speichern beheben", recommendations: "Planungshinweise und Empfehlungen" },
    navigation: { overview: "Dashboard", training: "Training", exercises: "Übungen", games: "Spiele", aiDrafts: "AI-Entwürfe", obstacles: "Hindernisse", outdoor: "Outdoor", groups: "Gruppen", media: "Medien" },
    language: "Sprache", languageGerman: "Deutsch", languageEnglish: "English", appearance: "Darstellung", themeSystem: "System", themeLight: "Hell", themeDark: "Dunkel", skipToContent: "Zum Hauptinhalt springen", pageActions: "Seitenaktionen", breadcrumbLabel: "Brotkrümelnavigation", mobileNavigation: "Hauptnavigation mobil", navigationLabel: "Hauptnavigation", help: "Tutorial öffnen", version: "Version", dialogClose: "Dialog schließen", close: "Schließen", tourClose: "Tutorial schließen", tourPrevious: "Zurück", tourNext: "Weiter", tourFinish: "Fertig", tourSkip: "Überspringen", tourStep: "Schritt", tourLocate: "Zum Element springen",
  },
  en: {
    venues: { indoorConflict: "The selected club venue is outdoors. Choose Outdoor or clear the venue selection.", title: "Club venue", none: "No specific venue", help: "Selecting a venue sets planning to Outdoor. Declare equipment and available obstacles separately.", court: "Overall area 40 × 20 m, synthetic grass. Usable space, run-off and permitted loads are not recorded; no shuttle length is inferred.", track: "Field with a 400 m running track. Lane width, access, transitions and current occupancy are not recorded.", unknown: "Area known; dimensions and surface not yet recorded. Define routes and safety clearances on site.", planningWarning: "The venue profile does not approve usable space or safety. Check usable area, occupancy, weather, routes, supervision and equipment on site; running volume and time are not yet automatically verified.", names: { "large-field": "Large field", "obstacle-area": "Obstacle area", "synthetic-court": "Synthetic-grass court · 40 × 20 m", "athletics-field": "Field with 400 m track" } },
    seedReviewEvidence: { title: "Seed review evidence", versioned: "Versioned review records", compatibility: "Compatibility markers", needsWork: "Needs work / unclear evidence", missing: "No review record", explanation: "Compatibility markers were backfilled automatically and do not represent content approval. Complete fields and versioned review records also do not replace review of the current content and its images." },
    planningEligibility: { noCandidates: "No exercises with matching, complete basic data are available for this plan. Check age, equipment, restrictions and catalog details. No training proposal was created.", title: "Which exercises can be planned automatically?", description: "Automatic proposals require a minimum age, audience and location suitability, risk, station capacity, training goals and movement patterns. Entries with missing basic data remain in the catalog for editing. This does not replace content review and approval." },
    recovery: { saving: "Backing up local plan …", found: "Local plan found", restore: "Restore plan", discard: "Discard local plan", stored: "Plan backed up on this device", restored: "Plan restored", unavailable: "Local backup unavailable. You can continue using your current inputs.", review: "The backup contains planning inputs. Generate a new draft and review it before saving. This does not automatically save or approve a training session." },
    trainingOverview: { title: "Session overview", audience: "Audience", age: "Age", unknown: "Not recorded", planned: "Planned", target: "Target", minutes: "min", kids: "Children", youth: "Youth", adults: "Adults", mixed: "Mixed", warmup: "Warm-up", main: "Main part", cooldown: "Cooldown & stretching" },
    trainingValidation: { created: "Training draft created", review: "Review the draft and its notes before saving.", clear: "Plan check: no issues", errors: "Errors", warnings: "Notes", blocked: "Resolve before saving", recommendations: "Planning notes and recommendations" },
    navigation: { overview: "Dashboard", training: "Training", exercises: "Exercises", games: "Games", aiDrafts: "AI drafts", obstacles: "Obstacles", outdoor: "Outdoor", groups: "Groups", media: "Media" },
    language: "Language", languageGerman: "German", languageEnglish: "English", appearance: "Appearance", themeSystem: "System", themeLight: "Light", themeDark: "Dark", skipToContent: "Skip to main content", pageActions: "Page actions", breadcrumbLabel: "Breadcrumb navigation", mobileNavigation: "Mobile main navigation", navigationLabel: "Main navigation", help: "Open tutorial", version: "Version", dialogClose: "Close dialog", close: "Close", tourClose: "Close tutorial", tourPrevious: "Back", tourNext: "Next", tourFinish: "Done", tourSkip: "Skip", tourStep: "Step", tourLocate: "Jump to element",
  },
};

export function isLocale(value: string | null | undefined): value is Locale { return value === "de" || value === "en"; }
export function getDictionary(locale: Locale): UiDictionary { return dictionaries[locale]; }
