"use client";

import { useEffect, useId, useRef } from "react";

export function Dialog({
  title,
  eyebrow,
  onClose,
  children,
}: {
  readonly title: string;
  readonly eyebrow?: string;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    firstFocusable?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      )].filter((element) => !element.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; previousActive?.focus(); };
  }, [onClose]);

  return (
    <div aria-labelledby={titleId} aria-modal="true" className="fixed inset-0 z-[1000] isolate flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog">
      <div className="relative z-[1001] max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-raised)]" ref={panelRef}>
        <div className="flex items-start justify-between gap-3">
          <div>{eyebrow ? <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{eyebrow}</div> : null}<h2 className="mt-1 text-xl font-black" id={titleId}>{title}</h2></div>
          <button aria-label="Dialog schließen" className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold" onClick={onClose} type="button">Schließen</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
