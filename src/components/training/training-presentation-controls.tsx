"use client";

import { useCallback, useId, useRef, useState, useSyncExternalStore } from "react";
import { buttonClass } from "@/components/ui/form";
import { useLocale } from "@/components/i18n/locale-provider";

interface TrainingPresentationControlsProps {
  readonly fullscreenTargetId?: string;
  readonly showPrint?: boolean;
}

type FullscreenFailure = "unavailable" | "enterFailed" | "exitFailed";

export function TrainingPresentationControls({ fullscreenTargetId, showPrint = true }: TrainingPresentationControlsProps) {
  const { dictionary } = useLocale();
  const text = dictionary.presentation;
  const [failure, setFailure] = useState<FullscreenFailure | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const errorId = useId();
  const subscribe = useCallback((onChange: () => void) => {
    const changed = () => { setFailure(null); onChange(); };
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  const fullscreen = useSyncExternalStore(subscribe, () => Boolean(document.fullscreenElement), () => false);

  async function toggleFullscreen() {
    if (busy.current) return;
    setFailure(null);
    const exiting = Boolean(document.fullscreenElement);
    const target = fullscreenTargetId ? document.getElementById(fullscreenTargetId) : document.documentElement;
    if (!exiting && (!target || typeof target.requestFullscreen !== "function" || document.fullscreenEnabled === false)) {
      setFailure("unavailable");
      return;
    }
    if (exiting && typeof document.exitFullscreen !== "function") {
      setFailure("exitFailed");
      return;
    }
    busy.current = true;
    setPending(true);
    try {
      if (exiting) await document.exitFullscreen();
      else await target!.requestFullscreen();
    } catch { setFailure(exiting ? "exitFailed" : "enterFailed"); }
    finally { busy.current = false; setPending(false); }
  }

  return (
    <div className="grid min-w-0 gap-2 print:hidden">
      <div className="flex flex-wrap gap-2">
        {fullscreenTargetId ? <button aria-describedby={failure ? errorId : undefined} aria-pressed={fullscreen} className={buttonClass("secondary")} disabled={pending} onClick={() => void toggleFullscreen()} type="button">{pending ? text.pending : fullscreen ? text.exit : text.enter}</button> : null}
        {showPrint ? <button className={buttonClass("secondary")} onClick={() => window.print()} type="button">{text.print}</button> : null}
      </div>
      {failure ? <p className="max-w-lg rounded-md border border-[var(--warning)] bg-[var(--warning-bg)] p-3 text-sm font-semibold text-[var(--warning)]" id={errorId} role="alert">{text[failure]}</p> : null}
    </div>
  );
}
