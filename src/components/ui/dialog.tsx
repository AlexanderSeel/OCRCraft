"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export function Dialog({
  title,
  eyebrow,
  onClose,
  size = "compact",
  children,
}: {
  readonly title: string;
  readonly eyebrow?: string;
  readonly onClose: () => void;
  readonly size?: "compact" | "wide";
  readonly children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);

  useEffect(() => {
    if (!mounted) return;
    document.body.dataset.dialogOpen = "true";
    return () => { delete document.body.dataset.dialogOpen; };
  }, [mounted]);

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
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div aria-labelledby={titleId} aria-modal="true" className="fixed inset-0 z-[2147483000] isolate flex items-center justify-center bg-black/[.52] p-4 shadow-[inset_0_0_120px_rgba(0,0,0,0.28)] backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog">
      <div className={`relative z-[2147483001] max-h-[min(90vh,52rem)] w-full overflow-y-auto rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.42)] ${size === "wide" ? "max-w-5xl" : "max-w-2xl"}`} ref={panelRef}>
        <div className="flex items-start justify-between gap-3">
          <div>{eyebrow ? <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{eyebrow}</div> : null}<h2 className="mt-1 text-xl font-black" id={titleId}>{title}</h2></div>
          <button aria-label="Dialog schließen" className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-bold hover:bg-[var(--surface-subtle)]" onClick={onClose} type="button">Schließen</button>
        </div>
        <div className="dialog-content mt-3 min-w-0">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
