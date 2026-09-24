export type TourCopy = { readonly title: string; readonly text: string };
export type TourStep = { readonly selector: string; readonly de: TourCopy; readonly en: TourCopy };
export type TourGuide = { readonly id: string; readonly de: string; readonly en: string; readonly steps: readonly TourStep[] };

function areaSteps(area: string, deTitle: string, enTitle: string): readonly TourStep[] {
  return [
    {
      selector: `[data-tour='nav-${area}']`,
      de: { title: `${deTitle} öffnen`, text: "Nutze die Hauptnavigation, um diesen Arbeitsbereich direkt zu erreichen." },
      en: { title: `Open ${enTitle}`, text: "Use the main navigation to reach this workspace directly." },
    },
    {
      selector: "[data-tour='page-content']",
      de: { title: "Arbeitsfläche", text: "Ergebnisse, Filter, Status und Aktionen liegen in derselben wiederkehrenden Seitenstruktur." },
      en: { title: "Workspace", text: "Results, filters, status and actions use the same recurring page structure." },
    },
  ];
}

export const TOUR_GUIDES: readonly TourGuide[] = [
  { id: "overview", de: "Dashboard", en: "Dashboard", steps: areaSteps("overview", "Dashboard", "dashboard") },
  { id: "training", de: "Trainingsplanung", en: "Training planning", steps: areaSteps("training", "Trainingsplanung", "training planning") },
  { id: "exercises", de: "Übungsbibliothek", en: "Exercise library", steps: areaSteps("exercises", "Übungsbibliothek", "exercise library") },
  {
    id: "exercise-create",
    de: "Übung erstellen",
    en: "Create an exercise",
    steps: [
      {
        selector: "[data-tour='exercise-identity']",
        de: { title: "Grunddaten", text: "Beginne mit Name, Kategorie und Sicherheitsrahmen. Danach öffnet sich der vollständige Editor." },
        en: { title: "Core data", text: "Start with the name, category and safety frame. The full editor opens next." },
      },
      {
        selector: "[data-tour='page-content']",
        de: { title: "Vollständiger Editor", text: "Ergänze anschließend Equipment, Körperregionen, Dosierung, Progression und DE/EN-Coaching." },
        en: { title: "Full editor", text: "Then add equipment, body regions, dosage, progression and DE/EN coaching." },
      },
    ],
  },
  {
    id: "obstacles",
    de: "Hindernisse",
    en: "Obstacles",
    steps: [
      ...areaSteps("obstacles", "Hindernisse", "obstacles"),
      {
        selector: "[data-tour='obstacle-create']",
        de: { title: "Übung zuordnen", text: "Übernimm eine bestehende Übung als Hindernis, statt den Bewegungsdatensatz zu duplizieren." },
        en: { title: "Assign an exercise", text: "Reuse an existing exercise as an obstacle instead of duplicating the movement record." },
      },
    ],
  },
  {
    id: "training-create",
    de: "Trainingsplan erstellen",
    en: "Create a training plan",
    steps: [
      {
        selector: "[data-tour='quick-create']",
        de: { title: "Quick Create", text: "Starte mit Gruppe, Alter, Dauer und Ziel. OCRCraft berechnet daraus einen prüfbaren Entwurf." },
        en: { title: "Quick Create", text: "Start with group, age, duration and goal. OCRCraft creates a reviewable draft." },
      },
      {
        selector: "[data-tour='builder']",
        de: { title: "Plan prüfen", text: "Kontrolliere Aufwärmen, Hauptteil und Cooldown, passe Übungen an und speichere erst nach der Trainerprüfung." },
        en: { title: "Review the plan", text: "Check warm-up, main part and cooldown, adjust exercises and save only after trainer review." },
      },
    ],
  },
  { id: "games", de: "Spiele", en: "Games", steps: areaSteps("games", "Spiele", "games") },
  { id: "groups", de: "Gruppen", en: "Groups", steps: areaSteps("groups", "Gruppen", "groups") },
  { id: "media", de: "Medien", en: "Media", steps: areaSteps("media", "Medien", "media") },
  { id: "ai-drafts", de: "AI-Entwürfe", en: "AI drafts", steps: areaSteps("aiDrafts", "AI-Entwürfe", "AI drafts") },
  { id: "outdoor", de: "Outdoor-Varianten", en: "Outdoor variants", steps: areaSteps("outdoor", "Outdoor-Varianten", "outdoor variants") },
  { id: "admin", de: "Administration", en: "Administration", steps: areaSteps("admin", "Administration", "administration") },
] as const;

export function guideForPath(pathname: string): TourGuide {
  if (pathname === "/exercises/new") return byId("exercise-create");
  if (pathname === "/quick-create" || pathname === "/training/builder") return byId("training-create");
  if (pathname.startsWith("/exercises/ai-drafts")) return byId("ai-drafts");
  if (pathname.startsWith("/exercises")) return byId("exercises");
  if (pathname.startsWith("/obstacles")) return byId("obstacles");
  if (pathname.startsWith("/games")) return byId("games");
  if (pathname.startsWith("/groups")) return byId("groups");
  if (pathname.startsWith("/media")) return byId("media");
  if (pathname.startsWith("/admin/outdoor")) return byId("outdoor");
  if (pathname.startsWith("/admin")) return byId("admin");
  if (pathname.startsWith("/training")) return byId("training");
  return byId("overview");
}

function byId(id: TourGuide["id"]): TourGuide {
  const guide = TOUR_GUIDES.find((candidate) => candidate.id === id);
  if (!guide) throw new Error(`Unknown tutorial guide: ${id}`);
  return guide;
}


export interface TourProgress {
  readonly stepIndex: number;
  readonly completed: boolean;
}

export function parseTourProgress(raw: string | null, stepCount: number): TourProgress {
  const safeStepCount = Math.max(1, Math.trunc(stepCount));
  if (!raw) return { stepIndex: 0, completed: false };
  try {
    const parsed = JSON.parse(raw) as Partial<TourProgress>;
    const completed = parsed.completed === true;
    const numericStep = Number(parsed.stepIndex ?? 0);
    const stepIndex = Number.isFinite(numericStep)
      ? Math.min(safeStepCount - 1, Math.max(0, Math.trunc(numericStep)))
      : 0;
    return { stepIndex, completed };
  } catch {
    return { stepIndex: 0, completed: false };
  }
}

export function serializeTourProgress(progress: TourProgress): string {
  return JSON.stringify(progress);
}
