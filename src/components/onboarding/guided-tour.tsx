"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { APP_RELEASE_LABEL } from "@/config/app-version";
import { Dialog } from "@/components/ui/dialog";
import { useLocale } from "@/components/i18n/locale-provider";
import { guideForPath, parseTourProgress, serializeTourProgress } from "./guided-tour-core";

export function GuidedTour() {
  const pathname = usePathname();
  const { locale, dictionary } = useLocale();
  const guide = useMemo(() => guideForPath(pathname), [pathname]);
  const [tourState, setTourState] = useState({
    guideId: guide.id,
    open: false,
    stepIndex: 0,
    targetAvailable: true,
  });
  const open = tourState.guideId === guide.id && tourState.open;
  const stepIndex = tourState.guideId === guide.id ? tourState.stepIndex : 0;
  const targetAvailable = tourState.guideId === guide.id ? tourState.targetAvailable : true;
  const step = guide.steps[stepIndex] ?? guide.steps[0];
  const progressKey = `ocrcraft-tour-progress:${guide.id}`;

  const focusStep = useCallback(() => {
    document.querySelectorAll("[data-tour-active='true']").forEach((element) => element.removeAttribute("data-tour-active"));
    const target = document.querySelector<HTMLElement>(step.selector);
    target?.setAttribute("data-tour-active", "true");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);

  useEffect(() => { if (open) focusStep(); return () => { document.querySelectorAll("[data-tour-active='true']").forEach((element) => element.removeAttribute("data-tour-active")); }; }, [focusStep, open]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTourState((current) => ({ ...current, open: false }));
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function persist(nextStepIndex: number, completed: boolean) {
    window.localStorage.setItem(progressKey, serializeTourProgress({ stepIndex: nextStepIndex, completed }));
  }

  function targetExists(index: number): boolean {
    const candidate = guide.steps[index] ?? guide.steps[0];
    return Boolean(document.querySelector(candidate.selector));
  }

  function start() {
    const progress = parseTourProgress(window.localStorage.getItem(progressKey), guide.steps.length);
    const nextStepIndex = progress.completed ? 0 : progress.stepIndex;
    setTourState({
      guideId: guide.id,
      open: true,
      stepIndex: nextStepIndex,
      targetAvailable: targetExists(nextStepIndex),
    });
  }

  function close() {
    setTourState((current) => ({ ...current, open: false }));
  }

  function goTo(nextStepIndex: number) {
    const bounded = Math.min(guide.steps.length - 1, Math.max(0, nextStepIndex));
    setTourState({
      guideId: guide.id,
      open: true,
      stepIndex: bounded,
      targetAvailable: targetExists(bounded),
    });
    persist(bounded, false);
  }

  function advance() {
    if (stepIndex >= guide.steps.length - 1) {
      persist(0, true);
      close();
    } else {
      goTo(stepIndex + 1);
    }
  }

  return <>
    <button aria-label={dictionary.help} className="grid size-10 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-base font-black text-[var(--muted)] hover:text-[var(--foreground)]" data-tour-trigger="guided-help" onClick={start} title={`${dictionary.help}: ${locale === "de" ? guide.de : guide.en}`} type="button">?</button>
    {open ? <Dialog onClose={close} title={locale === "de" ? guide.de : guide.en} eyebrow={APP_RELEASE_LABEL}>
      <div aria-live="polite" className="grid gap-4">
        <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]"><span>{dictionary.tourStep} {stepIndex + 1} / {guide.steps.length}</span><button className="font-black underline underline-offset-4" onClick={close} type="button">{dictionary.tourSkip}</button></div>
        <div className="rounded-lg border border-[var(--brand)] bg-[var(--brand-soft)] p-4"><h3 className="text-lg font-black">{locale === "de" ? step.de.title : step.en.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{locale === "de" ? step.de.text : step.en.text}</p></div>
        {!targetAvailable ? <p className="rounded-lg border border-[var(--warning)] bg-[var(--warning-bg)] p-3 text-sm font-bold text-[var(--warning)]">{locale === "de" ? "Das Ziel dieses Schritts ist in der aktuellen Ansicht nicht sichtbar. Du kannst fortfahren oder die Führung später erneut öffnen." : "The target for this step is not visible in the current view. You can continue or reopen the guide later."}</p> : null}
        <div className="flex flex-wrap justify-between gap-2"><button className="min-h-10 rounded-md border border-[var(--border)] px-3 text-sm font-black disabled:opacity-40" disabled={stepIndex === 0} onClick={() => goTo(stepIndex - 1)} type="button">{dictionary.tourPrevious}</button><button className="min-h-10 rounded-md bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" onClick={advance} type="button">{stepIndex >= guide.steps.length - 1 ? dictionary.tourFinish : dictionary.tourNext}</button></div>
      </div>
    </Dialog> : null}
  </>;
}
