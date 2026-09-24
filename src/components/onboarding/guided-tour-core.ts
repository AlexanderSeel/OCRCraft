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
      {
        selector: "[data-tour='exercise-save']",
        de: { title: "Speichern und prüfen", text: "Speichere erst, wenn Sicherheits-, Equipment- und Coachingangaben geprüft sind. Die Übung bleibt danach weiter bearbeitbar." },
        en: { title: "Save and review", text: "Save only after checking safety, equipment and coaching details. The exercise remains editable afterwards." },
      },
    ],
  },
  {
    id: "obstacles",
    de: "Hindernis erstellen / zuordnen",
    en: "Create / assign an obstacle",
    steps: [
      {
        selector: "[data-tour='obstacle-create']",
        de: { title: "Bestehende Übung verwenden", text: "Suche zuerst eine passende aktive Übung. OCRCraft ergänzt Hindernis-Guidance, statt den Bewegungsdatensatz zu duplizieren." },
        en: { title: "Reuse an existing exercise", text: "Start by finding a suitable active exercise. OCRCraft adds obstacle guidance instead of duplicating the movement record." },
      },
      {
        selector: "[data-tour='obstacle-candidate-search']",
        de: { title: "Kandidaten eingrenzen", text: "Suche nach Name, Bewegung oder OCR-Bezug und wähle nur einen fachlich passenden Kandidaten." },
        en: { title: "Narrow the candidates", text: "Search by name, movement, or OCR context and choose only a semantically appropriate candidate." },
      },
      {
        selector: "[data-tour='obstacle-candidate-review']",
        de: { title: "Kandidat prüfen", text: "Prüfe Kategorie und Risikostufe. Bei Unsicherheit nutze „Übernehmen & prüfen“, damit die Hindernis-Guidance vor Verwendung geöffnet wird." },
        en: { title: "Review the candidate", text: "Check category and risk level. When uncertain, use “Assign & review” so obstacle guidance is opened before use." },
      },
      {
        selector: "[data-tour='obstacle-safety-review']",
        de: { title: "Sicherheit und Kapazität", text: "Kontrolliere Freizone, Aufsicht, Mindestalter, Stationskapazität, Aufbau und sicheren Fallback, bevor das Hindernis im Training eingesetzt wird." },
        en: { title: "Safety and capacity", text: "Check clear zone, supervision, minimum age, station capacity, setup, and a safe fallback before using the obstacle in training." },
      },
      {
        selector: "[data-tour='obstacle-edit']",
        de: { title: "Trainerreview abschließen", text: "Öffne die Hindernis-Bearbeitung, wenn Maße, Ablauf oder Sicherheit noch angepasst werden müssen. Erst danach gilt die Zuordnung als fachlich geprüft." },
        en: { title: "Complete trainer review", text: "Open obstacle editing when dimensions, flow, or safety still need changes. Treat the assignment as reviewed only afterwards." },
      },
    ],
  },
  {
    id: "quick-create",
    de: "Quick Create Training",
    en: "Quick Create training",
    steps: [
      {
        selector: "[data-tour='quick-create-audience']",
        de: { title: "Gruppe, Alter und Dauer", text: "Lege zuerst Zielgruppe, Altersbereich, Teilnehmerzahl und Dauer fest. Diese Werte begrenzen Skalierung und Sicherheitsregeln." },
        en: { title: "Group, age, and duration", text: "Start with audience, age range, participant count, and duration. These values constrain scaling and safety rules." },
      },
      {
        selector: "[data-tour='quick-create-goals']",
        de: { title: "Ziele und Körperregionen", text: "Wähle Trainingsziele, Fokusregionen und bei Bedarf Bereiche, die bewusst nicht belastet werden sollen." },
        en: { title: "Goals and body regions", text: "Choose training goals, focus regions, and any areas that should deliberately not be loaded." },
      },
      {
        selector: "[data-tour='quick-create-format']",
        de: { title: "Ort, Format und Bestand", text: "Ort, Rotationsgruppen, Equipment und reale OCR-Hindernisse werden als praktische Planungsgrenzen übernommen." },
        en: { title: "Location, format, and inventory", text: "Location, rotation groups, equipment, and real OCR obstacles are treated as practical planning constraints." },
      },
      {
        selector: "[data-tour='quick-create-intensity']",
        de: { title: "Belastung festlegen", text: "Wähle Technik, ausgewogene Belastung oder Conditioning. Sicherheitsregeln werden dadurch niemals abgeschwächt." },
        en: { title: "Set training load", text: "Choose technique, balanced load, or conditioning. Safety rules are never weakened by this choice." },
      },
      {
        selector: "[data-tour='quick-create-review']",
        de: { title: "Trainerreview", text: "Prüfe Zusammenfassung, Warnungen und den erzeugten Entwurf. Erst nach dieser Kontrolle wird gespeichert." },
        en: { title: "Trainer review", text: "Review the summary, warnings, and generated draft. Save only after this check." },
      },
      {
        selector: "[data-tour='quick-create-actions']",
        de: { title: "Entwurf erzeugen und speichern", text: "Erzeuge den Trainingsentwurf, kontrolliere ihn und speichere anschließend die validierte Einheit." },
        en: { title: "Generate and save the draft", text: "Generate the training draft, review it, and then save the validated session." },
      },
    ],
  },
  {
    id: "training-builder",
    de: "Training Builder",
    en: "Training Builder",
    steps: [
      {
        selector: "[data-tour='builder-setup']",
        de: { title: "Rahmen festlegen", text: "Definiere Zielgruppe, Alter, Teilnehmerzahl, Dauer und Ort als harte Planungsparameter." },
        en: { title: "Set the frame", text: "Define audience, age, participant count, duration, and location as hard planning parameters." },
      },
      {
        selector: "[data-tour='builder-structure']",
        de: { title: "Trainingsstruktur", text: "Lege Warm-up, Hauptteile, Cooldown, Rotationsgruppen und Programmierung je Hauptteil fest." },
        en: { title: "Training structure", text: "Set warm-up, main parts, cooldown, rotation groups, and programming for each main part." },
      },
      {
        selector: "[data-tour='builder-goals']",
        de: { title: "Ziele und Auswahlregeln", text: "Wähle Ziele, Übungstypen, Körperregionen und Wunschübungen. Ausschlüsse bleiben harte Grenzen." },
        en: { title: "Goals and selection rules", text: "Choose goals, exercise types, body regions, and preferred exercises. Exclusions remain hard constraints." },
      },
      {
        selector: "[data-tour='builder-format']",
        de: { title: "Format, Equipment und Hindernisse", text: "Format, Intensität, Equipmentbestand und OCR-Hindernisse steuern die tatsächliche Umsetzbarkeit." },
        en: { title: "Format, equipment, and obstacles", text: "Format, intensity, equipment inventory, and OCR obstacles control real-world feasibility." },
      },
      {
        selector: "[data-tour='training-save']",
        de: { title: "Planen, prüfen, speichern", text: "Erzeuge zuerst einen lokalen oder AI-Entwurf, prüfe Warnungen und Änderungen und speichere erst dann." },
        en: { title: "Plan, review, and save", text: "Generate a local or AI draft first, review warnings and changes, and only then save it." },
      },
    ],
  },
  {
    id: "help",
    de: "Hilfezentrum",
    en: "Help center",
    steps: [
      {
        selector: "[data-tour='help-reopen']",
        de: { title: "Tutorials erneut öffnen", text: "Öffne die Führung im gewünschten Arbeitsbereich über die Hilfe-Schaltfläche. Nicht abgeschlossene Führungen setzen am gespeicherten Schritt fort." },
        en: { title: "Reopen tutorials", text: "Open a guide in the desired workspace through the help button. Incomplete guides resume at the saved step." },
      },
      {
        selector: "[data-tour='help-workspaces']",
        de: { title: "Arbeitsbereiche", text: "Über die Direkteinstiege erreichst du Kataloge und Planungsbereiche ohne Umweg." },
        en: { title: "Workspaces", text: "Use the direct links to reach catalogues and planning areas without detours." },
      },
      {
        selector: "[data-tour='help-glossary']",
        de: { title: "Begriffe und Fachhinweise", text: "Das Glossar erklärt zentrale Begriffe. Die Fachhinweise erinnern vor dem Speichern an Sicherheits- und Reviewgrenzen." },
        en: { title: "Terms and guidance", text: "The glossary explains key terms. The guidance highlights safety and review boundaries before saving." },
      },
    ],
  },
  { id: "games", de: "Spiele", en: "Games", steps: areaSteps("games", "Spiele", "games") },
  {
    id: "groups",
    de: "Gruppen",
    en: "Groups",
    steps: [
      {
        selector: "[data-tour='group-create']",
        de: { title: "Gruppe anlegen", text: "Nutze eine Startvorlage oder beginne leer. Name, Zielgruppe und Altersbereich bilden die Grundlage für sichere Trainingsvorschläge." },
        en: { title: "Create a group", text: "Use a preset or start blank. Name, audience, and age range form the basis for safe training suggestions." },
      },
      {
        selector: "[data-tour='group-filters']",
        de: { title: "Gruppen finden", text: "Filtere aktive oder archivierte Gruppen nach Name und Zielgruppe, ohne die gespeicherten Standardwerte zu verändern." },
        en: { title: "Find groups", text: "Filter active or archived groups by name and audience without changing saved defaults." },
      },
      {
        selector: "[data-tour='group-cards']",
        de: { title: "Standards prüfen", text: "Prüfe Alter, Teilnehmerzahl, Dauer, Ort, Equipment, Risikoprofil und Schutzprofil. Diese Werte können in Quick Create als Vereinsstandard dienen." },
        en: { title: "Review defaults", text: "Review age, participant count, duration, location, equipment, risk profile, and safeguarding profile. These values can guide Quick Create." },
      },
    ],
  },
  {
    id: "media",
    de: "Medienreview",
    en: "Media review",
    steps: [
      {
        selector: "[data-tour='media-filters']",
        de: { title: "Medien filtern", text: "Grenze Medien nach Übung, Reviewstatus, Quelle, Generierung und Medientyp ein. Der Filterzustand bleibt in der URL nachvollziehbar." },
        en: { title: "Filter media", text: "Narrow media by exercise, review status, source, generation, and media type. Filter state remains traceable in the URL." },
      },
      {
        selector: "[data-tour='media-batch']",
        de: { title: "Batch- und KI-Aktionen", text: "Starte Bildjobs oder Freigaben nur für bewusst ausgewählte Medien. Laufende Jobs bleiben in der Warteschlange sichtbar." },
        en: { title: "Batch and AI actions", text: "Start image jobs or approvals only for deliberately selected media. Running jobs remain visible in the queue." },
      },
      {
        selector: "[data-tour='media-review']",
        de: { title: "Rechte und fachliches Review", text: "Prüfe Rechte, Einwilligung, Biomechanik und Textübereinstimmung. Externe oder unvollständig geprüfte Medien dürfen nicht still freigegeben werden." },
        en: { title: "Rights and expert review", text: "Check rights, consent, biomechanics, and text matching. External or incomplete media reviews must not be silently approved." },
      },
    ],
  },
  {
    id: "ai-drafts",
    de: "AI-Entwürfe prüfen",
    en: "Review AI drafts",
    steps: [
      {
        selector: "[data-tour='ai-draft-create']",
        de: { title: "Vorschlag erzeugen", text: "Formuliere ein Trainingsbriefing mit Zielgruppe, Zweck und verfügbarem Equipment. Die AI erzeugt nur einen Entwurf, keine aktive Übung." },
        en: { title: "Create a proposal", text: "Write a training brief with audience, purpose, and available equipment. AI creates only a draft, never an active exercise." },
      },
      {
        selector: "[data-tour='ai-draft-review']",
        de: { title: "Review Queue", text: "Prüfe Vorschlag, Herkunft, Begründung und den deterministischen Review. Blocker müssen vor einer Freigabe aufgelöst werden." },
        en: { title: "Review queue", text: "Check the proposal, provenance, rationale, and deterministic review. Blockers must be resolved before approval." },
      },
      {
        selector: "[data-tour='ai-draft-filters']",
        de: { title: "Offene und historische Entwürfe", text: "Nutze Suche, Filter und Verlauf, um offene Entwürfe gezielt zu bearbeiten. Erst die Trainerfreigabe öffnet den Voll-Editor." },
        en: { title: "Open and historical drafts", text: "Use search, filters, and history to work through drafts deliberately. Trainer approval is required before opening the full editor." },
      },
    ],
  },
  {
    id: "outdoor",
    de: "Outdoor-Varianten",
    en: "Outdoor variants",
    steps: [
      {
        selector: "[data-tour='outdoor-audit']",
        de: { title: "Portabilitäts-Audit", text: "Prüfe Herkunft, Begründung, Ersatz-Equipment und den aktuellen Reviewstatus jeder Portabilitätsentscheidung." },
        en: { title: "Portability audit", text: "Review the source, rationale, replacement equipment, and current review status for each portability decision." },
      },
      {
        selector: "[data-tour='outdoor-enrichment']",
        de: { title: "Outdoor-Varianten anreichern", text: "Übernimm nur eindeutig sichere Mappings. Generische Maschinen und unklare Ersatzgeräte bleiben blockiert und werden nicht geraten." },
        en: { title: "Enrich outdoor variants", text: "Apply only clearly safe mappings. Generic machines and unclear replacements stay blocked instead of being guessed." },
      },
      {
        selector: "[data-tour='outdoor-candidates']",
        de: { title: "Kandidaten fachlich prüfen", text: "Filtere nach Status, öffne die Übung und entscheide pro Kandidat über Equipment, Bewegungsmuster und Trainerfreigabe." },
        en: { title: "Review candidates", text: "Filter by status, open the exercise, and decide per candidate on equipment, movement pattern, and trainer approval." },
      },
    ],
  },
  { id: "admin", de: "Administration", en: "Administration", steps: areaSteps("admin", "Administration", "administration") },
] as const;

export function guideForPath(pathname: string): TourGuide {
  if (pathname === "/help") return byId("help");
  if (pathname === "/exercises/new") return byId("exercise-create");
  if (pathname === "/quick-create") return byId("quick-create");
  if (pathname === "/training/builder") return byId("training-builder");
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
