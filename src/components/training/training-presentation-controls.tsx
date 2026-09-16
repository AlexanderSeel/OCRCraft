"use client";

import { useEffect, useState } from "react";

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
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
          onClick={() => void toggleFullscreen()}
          type="button"
        >
          {fullscreen ? "Vollbild verlassen" : "Vollbild"}
        </button>
      ) : null}
      {showPrint ? (
        <button
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
          onClick={() => window.print()}
          type="button"
        >
          Drucken
        </button>
      ) : null}
    </div>
  );
}
