import type { Audience, BodyRegion, TrainingFormat, TrainingLocation } from "./model";

export const TRAINING_TEMPLATE_FOCUS_KEYS = [
  "endurance",
  "coordination",
  "strength",
  "mobility",
  "teamwork",
  "parcours",
] as const;

export type TrainingTemplateFocus = (typeof TRAINING_TEMPLATE_FOCUS_KEYS)[number];
export type TrainingTemplateIntensity = "technique" | "balanced" | "conditioning";

export interface TrainingTemplateProvenance {
  readonly authoring: "ocrcraft_original";
  readonly referenceProvider: "VIBSS";
  readonly referenceTitle: string;
  readonly referenceUrl: string;
  readonly relationship: "taxonomy_reference";
  readonly licenseNote: string;
}

export interface TrainingTemplateDefinition {
  readonly key: string;
  readonly titleDe: string;
  readonly titleEn: string;
  readonly descriptionDe: string;
  readonly descriptionEn: string;
  readonly audience: Audience;
  readonly minAge: number | null;
  readonly maxAge: number | null;
  readonly defaultParticipants: number;
  readonly durationMinutes: number;
  readonly focus: TrainingTemplateFocus;
  readonly goals: readonly string[];
  readonly bodyRegions: readonly BodyRegion[];
  readonly formats: readonly TrainingFormat[];
  readonly location: TrainingLocation;
  readonly intensity: TrainingTemplateIntensity;
  readonly structureDe: {
    readonly warmup: string;
    readonly main: string;
    readonly cooldown: string;
  };
  readonly materialHintsDe: readonly string[];
  readonly provenance: TrainingTemplateProvenance;
}

const adultReference: TrainingTemplateProvenance = {
  authoring: "ocrcraft_original",
  referenceProvider: "VIBSS",
  referenceTitle: "VIBSS · Stundenbeispiele für Erwachsene",
  referenceUrl: "https://www.vibss.de/sportpraxis/stundenbeispiele-pfp/erwachsene",
  relationship: "taxonomy_reference",
  licenseNote: "OCRCraft-Eigeninhalt. Die Referenz dient ausschließlich als Struktur-/Taxonomie-Inspiration; keine externen Texte oder Bilder wurden übernommen.",
};

const youthReference: TrainingTemplateProvenance = {
  authoring: "ocrcraft_original",
  referenceProvider: "VIBSS",
  referenceTitle: "VIBSS · Stundenbeispiele für Kinder und Jugendliche",
  referenceUrl: "https://www.vibss.de/sportpraxis/stundenbeispiele-pfp/kinder-und-jugendliche",
  relationship: "taxonomy_reference",
  licenseNote: "OCRCraft-Eigeninhalt. Die Referenz dient ausschließlich als Struktur-/Taxonomie-Inspiration; keine externen Texte oder Bilder wurden übernommen.",
};

function template(
  input: Omit<TrainingTemplateDefinition, "provenance">,
): TrainingTemplateDefinition {
  return {
    ...input,
    provenance: input.audience === "adults" ? adultReference : youthReference,
  };
}

export const TRAINING_TEMPLATES: readonly TrainingTemplateDefinition[] = [
  template({
    key: "adult-ocr-base-engine",
    titleDe: "OCR Base Engine",
    titleEn: "OCR Base Engine",
    descriptionDe: "Grundlagenausdauer mit kontrollierten Laufabschnitten und technisch einfachen Ganzkörperstationen.",
    descriptionEn: "Aerobic base work with controlled running segments and technically simple full-body stations.",
    audience: "adults", minAge: 16, maxAge: null, defaultParticipants: 14, durationMinutes: 75,
    focus: "endurance", goals: ["Laufen", "Ganzkörper", "Kraftausdauer"], bodyRegions: ["full-body", "core", "calves"],
    formats: ["run-exercise", "circuit"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Dynamisch mobilisieren und Lauftechnik aktivieren.", main: "Laufblöcke mit gleichmäßig dosierten Ganzkörperstationen koppeln.", cooldown: "Herzfrequenz senken und Hüfte/Wade mobilisieren." },
    materialHintsDe: ["Markierungen", "Stoppuhr", "optionale OCR-Basisstationen"],
  }),
  template({
    key: "adult-tempo-carry-intervals",
    titleDe: "Tempo & Carry Intervals",
    titleEn: "Tempo & Carry Intervals",
    descriptionDe: "Ausdauerorientierte Wechsel aus Laufarbeit, Carries und kurzer aktiver Erholung.",
    descriptionEn: "Endurance-focused alternation of running, carries and short active recovery.",
    audience: "adults", minAge: 18, maxAge: null, defaultParticipants: 12, durationMinutes: 75,
    focus: "endurance", goals: ["Laufen", "Kraftausdauer", "Core"], bodyRegions: ["full-body", "forearms-grip", "core"],
    formats: ["run-exercise", "emom"], location: "outdoor", intensity: "conditioning",
    structureDe: { warmup: "Lauf-ABC, Rumpfspannung und Carry-Vorbereitung.", main: "Tempoabschnitte mit tragenden Ganzkörperaufgaben alternieren.", cooldown: "Gehen, Atmung normalisieren, Unterarme und Hüfte lösen." },
    materialHintsDe: ["Markierungen", "tragbare Lasten optional", "Stoppuhr"],
  }),
  template({
    key: "kids-adventure-endurance-loop",
    titleDe: "Abenteuer-Ausdauer-Runde",
    titleEn: "Adventure Endurance Loop",
    descriptionDe: "Spielerische Ausdauer für Kinder mit kurzen Wegen, einfachen Aufgaben und häufigem Rollenwechsel.",
    descriptionEn: "Playful endurance for children with short routes, simple tasks and frequent role changes.",
    audience: "kids", minAge: 7, maxAge: 11, defaultParticipants: 12, durationMinutes: 60,
    focus: "endurance", goals: ["Laufen", "Koordination", "Ganzkörper"], bodyRegions: ["full-body", "core", "ankles-feet"],
    formats: ["relay", "circuit"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Fang- und Laufimpulse mit klaren Stoppsignalen.", main: "Kurze Runden mit leicht verständlichen Bewegungsaufgaben.", cooldown: "Ruhige Teamrunde, Atmung und lockere Mobilität." },
    materialHintsDe: ["Hütchen", "Markierungen", "leichte Spielmaterialien"],
  }),
  template({
    key: "youth-run-skill-switch",
    titleDe: "Run & Skill Wechsel",
    titleEn: "Run & Skill Switch",
    descriptionDe: "Jugendtraining mit kurzen Laufintervallen und technisch kontrollierten OCR-Aufgaben.",
    descriptionEn: "Youth session combining short running intervals with controlled OCR skill work.",
    audience: "youth", minAge: 12, maxAge: 17, defaultParticipants: 14, durationMinutes: 75,
    focus: "endurance", goals: ["Laufen", "OCR-Technik", "Koordination"], bodyRegions: ["full-body", "core", "forearms-grip"],
    formats: ["run-exercise", "technique"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Lauftechnik und gelenkschonende Aktivierung.", main: "Kurze Laufstrecken wechseln mit Technikfenstern ohne Ermüdungsdruck.", cooldown: "Locker auslaufen und Hauptbewegungen mobilisieren." },
    materialHintsDe: ["Hütchen", "niedrige Technikstationen", "Stoppuhr"],
  }),

  template({
    key: "adult-balance-under-control",
    titleDe: "Balance under Control",
    titleEn: "Balance under Control",
    descriptionDe: "Koordination und Gleichgewicht mit präziser Technik statt hoher Geschwindigkeit.",
    descriptionEn: "Coordination and balance with precise technique instead of high speed.",
    audience: "adults", minAge: 16, maxAge: null, defaultParticipants: 12, durationMinutes: 60,
    focus: "coordination", goals: ["Balance", "Koordination", "Core"], bodyRegions: ["core", "hips", "ankles-feet"],
    formats: ["technique", "circuit"], location: "mixed", intensity: "technique",
    structureDe: { warmup: "Fuß-/Sprunggelenkskontrolle und einfache Reaktionsmuster.", main: "Balance-, Richtungswechsel- und Stabilitätsstationen progressiv steigern.", cooldown: "Ruhige Mobilität und kontrollierte Einbeinpositionen." },
    materialHintsDe: ["Markierungen", "Balancemöglichkeiten", "Matten optional"],
  }),
  template({
    key: "adult-footwork-transitions",
    titleDe: "Footwork & Transitions",
    titleEn: "Footwork & Transitions",
    descriptionDe: "Schnelle, saubere Positionswechsel für OCR-Übergänge mit Fokus auf Fußarbeit.",
    descriptionEn: "Fast, clean positional changes for OCR transitions with a footwork focus.",
    audience: "adults", minAge: 16, maxAge: null, defaultParticipants: 14, durationMinutes: 60,
    focus: "coordination", goals: ["Koordination", "OCR-Technik", "Balance"], bodyRegions: ["ankles-feet", "calves", "core"],
    formats: ["circuit", "technique"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Schrittfolgen, Reaktion und kontrollierte Richtungswechsel.", main: "Fußarbeitsmuster mit technisch einfachen OCR-Übergängen verbinden.", cooldown: "Sprunggelenke und Waden entlasten, Tempo herunterfahren." },
    materialHintsDe: ["Hütchen", "Linien/Markierungen", "niedrige Hindernisse optional"],
  }),
  template({
    key: "kids-island-path",
    titleDe: "Inselpfad",
    titleEn: "Island Path",
    descriptionDe: "Koordinations-Parcours für Kinder: sichere Inseln erreichen, balancieren und Wege gemeinsam lösen.",
    descriptionEn: "Coordination course for children: reach safe islands, balance and solve routes together.",
    audience: "kids", minAge: 6, maxAge: 11, defaultParticipants: 12, durationMinutes: 60,
    focus: "coordination", goals: ["Koordination", "Balance", "Teamwork"], bodyRegions: ["full-body", "core", "ankles-feet"],
    formats: ["circuit", "relay"], location: "indoor", intensity: "technique",
    structureDe: { warmup: "Farben-/Inselspiel mit Gehen, Hüpfen und Stoppen.", main: "Mehrere sichere Wege mit Balance- und Kooperationsaufgaben.", cooldown: "Ruhige Inselrunde mit einfachen Mobilitätsbildern." },
    materialHintsDe: ["Matten", "Reifen oder Markierungen", "Hütchen"],
  }),
  template({
    key: "youth-agility-to-obstacle",
    titleDe: "Agility to Obstacle",
    titleEn: "Agility to Obstacle",
    descriptionDe: "Agilität, Reaktion und kontrollierter Übergang in eine OCR-Technikstation.",
    descriptionEn: "Agility, reaction and controlled transition into OCR skill stations.",
    audience: "youth", minAge: 12, maxAge: 17, defaultParticipants: 14, durationMinutes: 75,
    focus: "coordination", goals: ["Koordination", "OCR-Technik", "Balance"], bodyRegions: ["full-body", "core", "ankles-feet"],
    formats: ["technique", "circuit"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Reaktionsläufe und saubere Abbremsbewegungen.", main: "Agility-Muster führen in technisch passende, beaufsichtigte OCR-Aufgaben.", cooldown: "Tempo reduzieren und beanspruchte Gelenke mobilisieren." },
    materialHintsDe: ["Markierungen", "Agility-Hilfen optional", "OCR-Technikstationen"],
  }),

  template({
    key: "adult-ocr-strength-endurance",
    titleDe: "OCR Strength Endurance",
    titleEn: "OCR Strength Endurance",
    descriptionDe: "Ganzkörper-Kraftausdauer als kontrollierter Zirkel mit Push, Pull, Hinge, Squat und Core.",
    descriptionEn: "Full-body strength endurance circuit covering push, pull, hinge, squat and core.",
    audience: "adults", minAge: 18, maxAge: null, defaultParticipants: 12, durationMinutes: 75,
    focus: "strength", goals: ["Kraftausdauer", "Ganzkörper", "Core"], bodyRegions: ["full-body", "core", "upper-back"],
    formats: ["circuit", "amrap"], location: "mixed", intensity: "conditioning",
    structureDe: { warmup: "Bewegungsmuster technisch vorbereiten und Rumpf aktivieren.", main: "Ausgewogener Ganzkörperzirkel mit skalierbaren Levels.", cooldown: "Belastung ausschleichen und große Muskelgruppen mobilisieren." },
    materialHintsDe: ["Matten", "vereinsübliches Equipment optional", "Stoppuhr"],
  }),
  template({
    key: "adult-grip-pull-carry",
    titleDe: "Grip · Pull · Carry",
    titleEn: "Grip · Pull · Carry",
    descriptionDe: "OCR-spezifische Zug-, Griff- und Trageausdauer mit sauberer Schulter- und Rumpfkontrolle.",
    descriptionEn: "OCR-specific pulling, grip and carry endurance with controlled shoulders and trunk.",
    audience: "adults", minAge: 18, maxAge: null, defaultParticipants: 10, durationMinutes: 75,
    focus: "strength", goals: ["Grip", "Kraftausdauer", "OCR-Technik"], bodyRegions: ["forearms-grip", "lats", "core"],
    formats: ["circuit", "rig-run"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Schulterblattkontrolle, Handgelenke und Core vorbereiten.", main: "Grip-, Pull- und Carry-Blöcke mit ausreichender Erholung kombinieren.", cooldown: "Unterarme, Lat und Schultergürtel entspannen." },
    materialHintsDe: ["Griff-/Hangmöglichkeiten", "tragbare Lasten optional", "Matten"],
  }),
  template({
    key: "kids-strong-bodyweight",
    titleDe: "Stark mit Körpergewicht",
    titleEn: "Strong with Bodyweight",
    descriptionDe: "Kindgerechte Kraftgrundlagen über Stützen, Ziehen, Krabbeln und kontrolliertes Bewegen.",
    descriptionEn: "Child-friendly strength fundamentals through support, pulling, crawling and controlled movement.",
    audience: "kids", minAge: 7, maxAge: 11, defaultParticipants: 12, durationMinutes: 60,
    focus: "strength", goals: ["Ganzkörper", "Core", "Koordination"], bodyRegions: ["full-body", "core", "shoulders"],
    formats: ["circuit", "relay"], location: "indoor", intensity: "technique",
    structureDe: { warmup: "Tierbewegungen und spielerische Stützpositionen.", main: "Kurze kindgerechte Kraftstationen ohne Maximallast.", cooldown: "Locker ausschütteln, ruhig atmen und bewegen." },
    materialHintsDe: ["Matten", "niedrige sichere Geräte optional", "Markierungen"],
  }),
  template({
    key: "youth-athletic-basics",
    titleDe: "Athletik Basics",
    titleEn: "Athletic Basics",
    descriptionDe: "Jugendgerechte Kraftbasis mit Technikfokus, Rumpfkontrolle und sauberer Landung.",
    descriptionEn: "Youth strength fundamentals with technique focus, trunk control and clean landing mechanics.",
    audience: "youth", minAge: 12, maxAge: 17, defaultParticipants: 14, durationMinutes: 75,
    focus: "strength", goals: ["Ganzkörper", "Kraftausdauer", "Core"], bodyRegions: ["full-body", "core", "glutes"],
    formats: ["circuit", "technique"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Grundmuster, Rumpfspannung und Landekontrolle vorbereiten.", main: "Technisch klare Ganzkörperstationen mit skalierbarer Belastung.", cooldown: "Beweglichkeit und Atemrhythmus normalisieren." },
    materialHintsDe: ["Matten", "Markierungen", "leichtes Equipment optional"],
  }),

  template({
    key: "adult-mobility-for-ocr",
    titleDe: "Mobility for OCR",
    titleEn: "Mobility for OCR",
    descriptionDe: "Aktive Beweglichkeit für Schulter, Hüfte und Sprunggelenk mit direktem OCR-Bezug.",
    descriptionEn: "Active mobility for shoulders, hips and ankles with direct OCR relevance.",
    audience: "adults", minAge: 16, maxAge: null, defaultParticipants: 12, durationMinutes: 60,
    focus: "mobility", goals: ["Mobility", "OCR-Technik", "Core"], bodyRegions: ["shoulders", "hips", "ankles-feet"],
    formats: ["technique", "circuit"], location: "mixed", intensity: "technique",
    structureDe: { warmup: "Gelenke aktiv durch kontrollierte Bewegungsweiten führen.", main: "Mobilität und Stabilität in OCR-relevanten Positionen koppeln.", cooldown: "Ruhige Bewegungsfolgen ohne Endbereichszwang." },
    materialHintsDe: ["Matten", "Stab/Band optional", "freie Wandfläche optional"],
  }),
  template({
    key: "adult-shoulder-hip-reset",
    titleDe: "Shoulder & Hip Reset",
    titleEn: "Shoulder & Hip Reset",
    descriptionDe: "Regenerative Einheit mit Schulterblattkontrolle, Hüftmobilität und leichtem Core.",
    descriptionEn: "Regenerative session for scapular control, hip mobility and light core work.",
    audience: "adults", minAge: 16, maxAge: null, defaultParticipants: 12, durationMinutes: 60,
    focus: "mobility", goals: ["Mobility", "Core", "Ganzkörper"], bodyRegions: ["shoulders", "hips", "core"],
    formats: ["technique"], location: "indoor", intensity: "technique",
    structureDe: { warmup: "Sanfte Ganzkörpermobilisation und Atemrhythmus.", main: "Kontrollierte Schulter-, Hüft- und Core-Sequenzen.", cooldown: "Langsam ausklingen und Bewegungsqualität reflektieren." },
    materialHintsDe: ["Matten", "leichte Bänder optional"],
  }),
  template({
    key: "kids-move-through-course",
    titleDe: "Beweglich durch den Parcours",
    titleEn: "Move Through the Course",
    descriptionDe: "Beweglichkeit und Körperwahrnehmung für Kinder über niedrige, sichere Bewegungslandschaften.",
    descriptionEn: "Mobility and body awareness for children through low, safe movement landscapes.",
    audience: "kids", minAge: 6, maxAge: 11, defaultParticipants: 12, durationMinutes: 60,
    focus: "mobility", goals: ["Mobility", "Koordination", "Balance"], bodyRegions: ["full-body", "hips", "shoulders"],
    formats: ["circuit", "technique"], location: "indoor", intensity: "technique",
    structureDe: { warmup: "Große und kleine Bewegungsformen spielerisch erkunden.", main: "Kriechen, Rollen, Übersteigen und Balancieren in sicheren Höhen.", cooldown: "Ruhige Bewegungsbilder und Körperwahrnehmung." },
    materialHintsDe: ["Matten", "niedrige Kästen/Elemente", "Markierungen"],
  }),
  template({
    key: "youth-mobility-landing",
    titleDe: "Mobility & Landing",
    titleEn: "Mobility & Landing",
    descriptionDe: "Jugendgerechte Mobilität mit Schwerpunkt auf Sprunggelenk, Hüfte und kontrollierter Landung.",
    descriptionEn: "Youth mobility focusing on ankles, hips and controlled landing mechanics.",
    audience: "youth", minAge: 12, maxAge: 17, defaultParticipants: 14, durationMinutes: 60,
    focus: "mobility", goals: ["Mobility", "Koordination", "OCR-Technik"], bodyRegions: ["ankles-feet", "hips", "core"],
    formats: ["technique", "circuit"], location: "mixed", intensity: "technique",
    structureDe: { warmup: "Sprunggelenk und Hüfte dynamisch vorbereiten.", main: "Bewegungsweite mit stabilen Abbrems- und Landepositionen verbinden.", cooldown: "Ruhige Mobilisation und lockeres Ausschütteln." },
    materialHintsDe: ["Matten", "Linien/Markierungen", "niedrige Step-Höhen optional"],
  }),

  template({
    key: "adult-partner-engine",
    titleDe: "Partner Engine",
    titleEn: "Partner Engine",
    descriptionDe: "Partnertraining mit klarer Rollenverteilung, gemeinsamer Arbeitszeit und skalierbaren Ganzkörperaufgaben.",
    descriptionEn: "Partner training with clear roles, shared work time and scalable full-body tasks.",
    audience: "adults", minAge: 18, maxAge: null, defaultParticipants: 12, durationMinutes: 75,
    focus: "teamwork", goals: ["Teamwork", "Ganzkörper", "Kraftausdauer"], bodyRegions: ["full-body", "core", "forearms-grip"],
    formats: ["partner", "circuit"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Partnerabsprachen und synchronisierte Basisbewegungen.", main: "2er-Teams teilen Arbeit, zählen sauber und unterstützen ohne Zwangskontakt.", cooldown: "Gemeinsam auslaufen und kurze Teamreflexion." },
    materialHintsDe: ["Markierungen", "gemeinsam nutzbares Equipment optional"],
  }),
  template({
    key: "adult-team-relay-builder",
    titleDe: "Team Relay Builder",
    titleEn: "Team Relay Builder",
    descriptionDe: "Staffelartige Teamarbeit mit Technik, Ausdauer und klarer Übergabe zwischen Aufgaben.",
    descriptionEn: "Relay-style teamwork combining technique, endurance and clear task hand-offs.",
    audience: "adults", minAge: 16, maxAge: null, defaultParticipants: 15, durationMinutes: 75,
    focus: "teamwork", goals: ["Teamwork", "Laufen", "OCR-Technik"], bodyRegions: ["full-body", "core", "calves"],
    formats: ["relay", "run-exercise"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Teamweise Lauf- und Übergaberoutinen.", main: "Staffelblöcke mit klaren Aufgaben und fairen Wechseln.", cooldown: "Gemeinsames lockeres Auslaufen und Feedback." },
    materialHintsDe: ["Hütchen", "Staffelmarkierungen", "OCR-Stationen optional"],
  }),
  template({
    key: "kids-together-to-finish",
    titleDe: "Gemeinsam ans Ziel",
    titleEn: "Together to the Finish",
    descriptionDe: "Kooperatives Kindertraining, bei dem Gruppen Aufgaben nur gemeinsam vollständig lösen.",
    descriptionEn: "Cooperative children’s session where groups complete tasks together.",
    audience: "kids", minAge: 7, maxAge: 11, defaultParticipants: 12, durationMinutes: 60,
    focus: "teamwork", goals: ["Teamwork", "Koordination", "Ganzkörper"], bodyRegions: ["full-body", "core"],
    formats: ["relay", "circuit"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Namens-/Teamspiel mit Bewegung.", main: "Kooperative Stationen mit Rollenwechsel und gemeinsamen Erfolgsbedingungen.", cooldown: "Ruhiger Teamkreis und kurze positive Rückmeldung." },
    materialHintsDe: ["Bälle/leichte Spielgeräte", "Hütchen", "Matten optional"],
  }),
  template({
    key: "youth-crew-challenge",
    titleDe: "Crew Challenge",
    titleEn: "Crew Challenge",
    descriptionDe: "Jugendliche lösen in kleinen Teams wechselnde Technik-, Koordinations- und Ausdaueraufgaben.",
    descriptionEn: "Youth teams solve rotating technique, coordination and endurance tasks.",
    audience: "youth", minAge: 12, maxAge: 17, defaultParticipants: 15, durationMinutes: 75,
    focus: "teamwork", goals: ["Teamwork", "OCR-Technik", "Koordination"], bodyRegions: ["full-body", "core", "forearms-grip"],
    formats: ["relay", "circuit"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Kleine Teamaufgaben mit Kommunikation und Bewegung.", main: "Rotierende Crew-Stationen mit Technik- und Ausdaueranteilen.", cooldown: "Locker bewegen und als Team kurz auswerten." },
    materialHintsDe: ["Markierungen", "OCR-Stationen", "leichte Teamgeräte optional"],
  }),

  template({
    key: "adult-ocr-skills-circuit",
    titleDe: "OCR Skills Circuit",
    titleEn: "OCR Skills Circuit",
    descriptionDe: "Technikorientierter OCR-Zirkel für saubere Bewegungsabläufe und kontrollierte Progression.",
    descriptionEn: "Technique-oriented OCR circuit for clean movement patterns and controlled progression.",
    audience: "adults", minAge: 16, maxAge: null, defaultParticipants: 12, durationMinutes: 75,
    focus: "parcours", goals: ["OCR-Technik", "Koordination", "Grip"], bodyRegions: ["full-body", "forearms-grip", "core"],
    formats: ["technique", "circuit"], location: "mixed", intensity: "technique",
    structureDe: { warmup: "Griff, Schulter, Fußarbeit und Rumpf aktivieren.", main: "Mehrere Technikstationen mit klarer Level-Progression und viel Qualitätszeit.", cooldown: "Unterarme und Schultergürtel entlasten." },
    materialHintsDe: ["vorhandene OCR-Hindernisse", "Matten", "Markierungen"],
  }),
  template({
    key: "adult-rig-run-progression",
    titleDe: "Rig & Run Progression",
    titleEn: "Rig & Run Progression",
    descriptionDe: "Laufen und Rig-Technik werden schrittweise gekoppelt, ohne Qualität unter unnötiger Ermüdung zu verlieren.",
    descriptionEn: "Running and rig technique are progressively combined without sacrificing quality under unnecessary fatigue.",
    audience: "adults", minAge: 18, maxAge: null, defaultParticipants: 12, durationMinutes: 90,
    focus: "parcours", goals: ["OCR-Technik", "Laufen", "Grip"], bodyRegions: ["forearms-grip", "lats", "core", "calves"],
    formats: ["rig-run", "technique"], location: "outdoor", intensity: "balanced",
    structureDe: { warmup: "Lauftechnik, Schulterkontrolle und Griff vorbereiten.", main: "Vom isolierten Technikfenster zur moderaten Run-to-Rig-Kopplung steigern.", cooldown: "Gehen, Unterarme lockern und Schulter/Hüfte mobilisieren." },
    materialHintsDe: ["Rig/Hangmöglichkeiten", "Laufstrecke", "Markierungen"],
  }),
  template({
    key: "kids-mini-ocr-expedition",
    titleDe: "Mini OCR Expedition",
    titleEn: "Mini OCR Expedition",
    descriptionDe: "Sicherer Kinderparcours mit Kriechen, Balancieren, Übersteigen und kurzen Laufwegen.",
    descriptionEn: "Safe children’s obstacle course with crawling, balance, stepping-over and short running sections.",
    audience: "kids", minAge: 7, maxAge: 11, defaultParticipants: 12, durationMinutes: 60,
    focus: "parcours", goals: ["OCR-Technik", "Koordination", "Teamwork"], bodyRegions: ["full-body", "core", "ankles-feet"],
    formats: ["circuit", "relay"], location: "mixed", intensity: "technique",
    structureDe: { warmup: "Expeditionsspiel mit sicheren Bewegungsaufträgen.", main: "Niedrige Parcoursstationen mit festen Laufwegen und viel Aufsicht.", cooldown: "Ruhige Rückreise mit Mobilität und Teamabschluss." },
    materialHintsDe: ["Matten", "niedrige Kästen/Elemente", "Hütchen", "Seile am Boden"],
  }),
  template({
    key: "youth-parcours-tech-mix",
    titleDe: "Parcours Technik Mix",
    titleEn: "Parcours Technique Mix",
    descriptionDe: "Jugendparcours mit Balance, Griff, Übersteigen und kontrollierten Laufübergängen.",
    descriptionEn: "Youth obstacle session combining balance, grip, stepping-over and controlled running transitions.",
    audience: "youth", minAge: 12, maxAge: 17, defaultParticipants: 14, durationMinutes: 75,
    focus: "parcours", goals: ["OCR-Technik", "Koordination", "Grip"], bodyRegions: ["full-body", "forearms-grip", "core"],
    formats: ["technique", "rig-run"], location: "mixed", intensity: "balanced",
    structureDe: { warmup: "Gelenke, Griff und Fußarbeit vorbereiten.", main: "Technikstationen zuerst isoliert, danach in kurze Parcoursfolgen integrieren.", cooldown: "Locker auslaufen und beanspruchte Bereiche mobilisieren." },
    materialHintsDe: ["OCR-Hindernisse", "Markierungen", "Matten"],
  }),
];

export function getTrainingTemplateByKey(key: string | undefined): TrainingTemplateDefinition | undefined {
  if (!key) return undefined;
  return TRAINING_TEMPLATES.find((entry) => entry.key === key);
}

export function trainingTemplateFocusLabel(focus: TrainingTemplateFocus): string {
  if (focus === "endurance") return "Ausdauer";
  if (focus === "coordination") return "Koordination";
  if (focus === "strength") return "Kraft";
  if (focus === "mobility") return "Mobility";
  if (focus === "teamwork") return "Teamwork";
  return "Parcours";
}

export function trainingTemplateAudienceLabel(audience: Audience): string {
  if (audience === "kids") return "Kids";
  if (audience === "youth") return "Youth";
  if (audience === "adults") return "Erwachsene";
  return "Mixed";
}
