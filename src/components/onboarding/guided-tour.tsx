"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { APP_RELEASE_LABEL } from "@/config/app-version";
import { Dialog } from "@/components/ui/dialog";
import { useLocale } from "@/components/i18n/locale-provider";
import { guideForPath, parseTourProgress, serializeTourProgress } from "./guided-tour-core";
import { buttonClass } from "@/components/ui/form";

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

  useEffect(() => {
    document.querySelector("[data-tour-trigger='guided-help']")?.setAttribute("data-tour-ready", "true");
  }, []);

  const focusStep = useCallback(() => {
    document.querySelectorAll("[data-tour-active='true']").forEach((element) => element.removeAttribute("data-tour-active"));
    const targets = Array.from(document.querySelectorAll<HTMLElement>(step.selector));
    const target = targets.find((element) => element.getClientRects().length > 0) ?? targets[0];
    setTourState((current) => current.guideId === guide.id
      ? { ...current, targetAvailable: targets.length > 0 }
      : current);
    targets.forEach((element) => element.setAttribute("data-tour-active", "true"));
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [guide.id, step]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(focusStep);
    return () => window.cancelAnimationFrame(frame);
  }, [focusStep, open]);
  useEffect(() => {
    if (open) return undefined;
    document.querySelectorAll("[data-tour-active='true']").forEach((element) => element.removeAttribute("data-tour-active"));
    return undefined;
  }, [open, guide.id]);
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

  function activateTarget(index: number): boolean {
    document.querySelectorAll("[data-tour-active='true']").forEach((element) => element.removeAttribute("data-tour-active"));
    const candidate = guide.steps[index] ?? guide.steps[0];
    const targets = Array.from(document.querySelectorAll<HTMLElement>(candidate.selector));
    targets.forEach((element) => element.setAttribute("data-tour-active", "true"));
    return targets.length > 0;
  }

  function start() {
    const progress = parseTourProgress(window.localStorage.getItem(progressKey), guide.steps.length);
    const nextStepIndex = progress.completed ? 0 : progress.stepIndex;
    setTourState({
      guideId: guide.id,
      open: true,
      stepIndex: nextStepIndex,
      targetAvailable: activateTarget(nextStepIndex),
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
      targetAvailable: activateTarget(bounded),
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
    <button aria-label={dictionary.help} className={buttonClass("secondary", "size-10 p-0 text-base text-[var(--muted)] hover:text-[var(--foreground)]")} data-tour-ready="false" data-tour-trigger="guided-help" onClick={start} title={`${dictionary.help}: ${locale === "de" ? guide.de : guide.en}`} type="button">?</button>
    {open ? <Dialog onClose={close} title={locale === "de" ? guide.de : guide.en} eyebrow={APP_RELEASE_LABEL}>
      <div aria-live="polite" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]"><span>{dictionary.tourStep} {stepIndex + 1} / {guide.steps.length}</span><div className="flex flex-wrap items-center gap-3"><button className={buttonClass("ghost", "min-h-10 px-2 text-xs underline underline-offset-4 disabled:opacity-40")} disabled={!targetAvailable} onClick={focusStep} type="button">{dictionary.tourLocate}</button><button className={buttonClass("ghost", "min-h-10 px-2 text-xs underline underline-offset-4")} onClick={close} type="button">{dictionary.tourSkip}</button></div></div>
        <div className="rounded-lg border border-[var(--brand)] bg-[var(--brand-soft)] p-4"><h3 className="text-lg font-black">{locale === "de" ? step.de.title : step.en.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{locale === "de" ? step.de.text : step.en.text}</p></div>
        {!targetAvailable ? <p className="rounded-lg border border-[var(--warning)] bg-[var(--warning-bg)] p-3 text-sm font-bold text-[var(--warning)]">{locale === "de" ? "Das Ziel dieses Schritts ist in der aktuellen Ansicht nicht sichtbar. Du kannst fortfahren oder die Führung später erneut öffnen." : "The target for this step is not visible in the current view. You can continue or reopen the guide later."}</p> : null}
        <div className="flex flex-wrap justify-between gap-2"><button className={buttonClass("secondary", "min-h-10 rounded-md px-3 text-sm disabled:opacity-40")} disabled={stepIndex === 0} onClick={() => goTo(stepIndex - 1)} type="button">{dictionary.tourPrevious}</button><button className={buttonClass("primary", "min-h-10 rounded-md px-4 text-sm")} onClick={advance} type="button">{stepIndex >= guide.steps.length - 1 ? dictionary.tourFinish : dictionary.tourNext}</button></div>
      </div>
    </Dialog> : null}
  </>;
}
