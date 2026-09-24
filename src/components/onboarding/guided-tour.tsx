"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { APP_RELEASE_LABEL } from "@/config/app-version";
import { Dialog } from "@/components/ui/dialog";
import { useLocale } from "@/components/i18n/locale-provider";

type TourCopy = { readonly title: string; readonly text: string };
type TourStep = { readonly selector: string; readonly de: TourCopy; readonly en: TourCopy };
type TourGuide = { readonly id: string; readonly de: string; readonly en: string; readonly steps: readonly TourStep[] };

const guides: readonly TourGuide[] = [
  { id: "overview", de: "Dashboard", en: "Dashboard", steps: commonSteps("overview") },
  { id: "training", de: "Trainingsplanung", en: "Training planning", steps: commonSteps("training") },
  { id: "exercises", de: "Übungsbibliothek", en: "Exercise library", steps: commonSteps("exercises") },
  { id: "exercise-create", de: "Übung erstellen", en: "Create an exercise", steps: [{ selector: "[data-tour='exercise-identity']", de: { title: "Grunddaten", text: "Beginne mit Name, Kategorie und Sicherheitsrahmen. Danach öffnet sich der vollständige Editor." }, en: { title: "Core data", text: "Start with the name, category and safety frame. The full editor opens next." } }, { selector: "[data-tour='page-content']", de: { title: "Vollständiger Editor", text: "Ergänze anschließend Equipment, Körperregionen, Dosierung, Progression und DE/EN-Coaching." }, en: { title: "Full editor", text: "Then add equipment, body regions, dosage, progression and DE/EN coaching." } }] },
  { id: "obstacle-create", de: "Hindernis erstellen", en: "Create an obstacle", steps: [{ selector: "[data-tour='obstacle-create']", de: { title: "Übung zuordnen", text: "Übernimm eine bestehende Übung, statt sie zu duplizieren. Die Hindernis-Guidance bleibt strukturiert." }, en: { title: "Assign an exercise", text: "Reuse an existing exercise instead of duplicating it. Obstacle guidance stays structured." } }, { selector: "[data-tour='page-content']", de: { title: "Sicherheit prüfen", text: "Prüfe Aufbau, freie Sicherheitszone, Kapazität und sichere Fallback-Variante vor der Nutzung." }, en: { title: "Check safety", text: "Check setup, clear safety zone, capacity and a safe fallback before use." } }] },
  { id: "training-create", de: "Trainingsplan erstellen", en: "Create a training plan", steps: [{ selector: "[data-tour='quick-create']", de: { title: "Quick Create", text: "Starte mit Gruppe, Alter, Dauer und Ziel. OCRCraft berechnet daraus einen prüfbaren Entwurf." }, en: { title: "Quick Create", text: "Start with group, age, duration and goal. OCRCraft creates a reviewable draft." } }, { selector: "[data-tour='builder']", de: { title: "Plan prüfen", text: "Kontrolliere Aufwärmen, Hauptteil und Cooldown, passe Übungen an und speichere erst nach der Trainerprüfung." }, en: { title: "Review the plan", text: "Check warm-up, main part and cooldown, adjust exercises and save only after trainer review." } }] },
  { id: "groups", de: "Gruppen verwalten", en: "Manage groups", steps: commonSteps("groups") },
  { id: "games", de: "Spiele verwalten", en: "Manage games", steps: commonSteps("games") },
  { id: "media", de: "Medien prüfen", en: "Review media", steps: commonSteps("media") },
  { id: "ai-drafts", de: "AI-Entwürfe prüfen", en: "Review AI drafts", steps: commonSteps("aiDrafts") },
  { id: "outdoor", de: "Outdoor-Varianten", en: "Outdoor variants", steps: commonSteps("outdoor") },
  { id: "admin", de: "Administration", en: "Administration", steps: commonSteps("admin") },
];

function commonSteps(area: string): readonly TourStep[] {
  return [
    { selector: `[data-tour='nav-${area}']`, de: { title: "Bereich öffnen", text: "Nutze die Hauptnavigation, um diesen Arbeitsbereich direkt zu erreichen." }, en: { title: "Open the area", text: "Use the main navigation to reach this workspace directly." } },
    { selector: "[data-tour='page-content']", de: { title: "Arbeitsfläche", text: "Die Seite zeigt Ergebnisse, Filter und Aktionen in einem einheitlichen, prüfbaren Aufbau." }, en: { title: "Workspace", text: "The page keeps results, filters and actions in one consistent, reviewable layout." } },
  ];
}

function guideForPath(pathname: string): TourGuide {
  if (pathname === "/exercises/new") return guides.find((guide) => guide.id === "exercise-create")!;
  if (pathname === "/obstacles") return guides.find((guide) => guide.id === "obstacle-create")!;
  if (pathname === "/quick-create" || pathname === "/training/builder") return guides.find((guide) => guide.id === "training-create")!;
  if (pathname.startsWith("/training")) return guides.find((guide) => guide.id === "training")!;
  if (pathname.startsWith("/exercises/ai-drafts")) return guides.find((guide) => guide.id === "ai-drafts")!;
  if (pathname.startsWith("/exercises")) return guides.find((guide) => guide.id === "exercises")!;
  if (pathname.startsWith("/games")) return guides.find((guide) => guide.id === "games")!;
  if (pathname.startsWith("/groups")) return guides.find((guide) => guide.id === "groups")!;
  if (pathname.startsWith("/media")) return guides.find((guide) => guide.id === "media")!;
  if (pathname.startsWith("/admin/outdoor")) return guides.find((guide) => guide.id === "outdoor")!;
  if (pathname.startsWith("/admin")) return guides.find((guide) => guide.id === "admin")!;
  return guides.find((guide) => guide.id === "overview")!;
}

export function GuidedTour() {
  const pathname = usePathname();
  const { locale, dictionary } = useLocale();
  const guide = useMemo(() => guideForPath(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const step = guide.steps[stepIndex] ?? guide.steps[0];

  const focusStep = useCallback(() => {
    document.querySelectorAll("[data-tour-active='true']").forEach((element) => element.removeAttribute("data-tour-active"));
    const target = document.querySelector<HTMLElement>(step.selector);
    target?.setAttribute("data-tour-active", "true");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);

  useEffect(() => { if (open) focusStep(); return () => { document.querySelectorAll("[data-tour-active='true']").forEach((element) => element.removeAttribute("data-tour-active")); }; }, [focusStep, open]);
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; document.addEventListener("keydown", onKeyDown); return () => document.removeEventListener("keydown", onKeyDown); }, []);

  function start() { setStepIndex(0); setOpen(true); }
  function close() { setOpen(false); }
  function advance() { if (stepIndex >= guide.steps.length - 1) close(); else setStepIndex((current) => current + 1); }

  return <>
    <button aria-label={dictionary.help} className="grid size-10 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-base font-black text-[var(--muted)] hover:text-[var(--foreground)]" data-tour-trigger="guided-help" onClick={start} title={`${dictionary.help}: ${locale === "de" ? guide.de : guide.en}`} type="button">?</button>
    {open ? <Dialog onClose={close} title={locale === "de" ? guide.de : guide.en} eyebrow={APP_RELEASE_LABEL}>
      <div aria-live="polite" className="grid gap-4">
        <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]"><span>{dictionary.tourStep} {stepIndex + 1} / {guide.steps.length}</span><button className="font-black underline underline-offset-4" onClick={close} type="button">{dictionary.tourSkip}</button></div>
        <div className="rounded-lg border border-[var(--brand)] bg-[var(--brand-soft)] p-4"><h3 className="text-lg font-black">{locale === "de" ? step.de.title : step.en.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{locale === "de" ? step.de.text : step.en.text}</p></div>
        <div className="flex flex-wrap justify-between gap-2"><button className="min-h-10 rounded-md border border-[var(--border)] px-3 text-sm font-black disabled:opacity-40" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => current - 1)} type="button">{dictionary.tourPrevious}</button><button className="min-h-10 rounded-md bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" onClick={advance} type="button">{stepIndex >= guide.steps.length - 1 ? dictionary.tourFinish : dictionary.tourNext}</button></div>
      </div>
    </Dialog> : null}
  </>;
}
