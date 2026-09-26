"use client";

import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/form";

interface TrainingPresentationControlsProps {
  readonly fullscreenTargetId?: string;
  readonly showPrint?: boolean;
}

export function TrainingPresentationControls({
  fullscreenTargetId,
  showPrint = true,
}: TrainingPresentationControlsProps) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    const target = fullscreenTargetId
      ? document.getElementById(fullscreenTargetId)
      : document.documentElement;
    await target?.requestFullscreen();
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {fullscreenTargetId ? (
        <button
          className={buttonClass("secondary", "rounded-xl px-4 py-2.5 text-sm")}
          onClick={() => void toggleFullscreen()}
          type="button"
        >
          {fullscreen ? "Vollbild verlassen" : "Vollbild"}
        </button>
      ) : null}
      {showPrint ? (
        <button
          className={buttonClass("secondary", "rounded-xl px-4 py-2.5 text-sm")}
          onClick={() => window.print()}
          type="button"
        >
          Drucken
        </button>
      ) : null}
    </div>
  );
}
