"use client";

import { useEffect, useId, useRef, useState } from "react";

type FormAction = (formData: FormData) => void | Promise<void>;

interface ConfirmPopoverFormProps {
  readonly action: FormAction;
  readonly children?: React.ReactNode;
  readonly confirmLabel?: string;
  readonly description: string;
  readonly triggerClassName?: string;
  readonly triggerLabel: string;
  readonly title: string;
}

interface ConfirmPopoverButtonProps {
  readonly action: FormAction;
  readonly confirmLabel?: string;
  readonly description: string;
  readonly name: string;
  readonly title: string;
  readonly triggerClassName?: string;
  readonly triggerLabel: string;
  readonly value: string;
}

export function ConfirmPopoverForm({ action, children, confirmLabel = "Bestätigen", description, triggerClassName = "min-h-9 rounded-lg border border-[var(--danger)] px-3 py-2 text-xs font-black text-[var(--danger)]", triggerLabel, title }: ConfirmPopoverFormProps) {
  const { containerRef, open, panelRef, popoverId, setOpen, triggerRef } = useConfirmPopover();

  return (
    <div className="relative" ref={containerRef}>
      <button aria-controls={popoverId} aria-expanded={open} aria-haspopup="dialog" className={triggerClassName} onClick={() => setOpen((value) => !value)} ref={triggerRef} type="button">{triggerLabel}</button>
      {open ? (
        <div aria-labelledby={`${popoverId}-title`} className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-card)]" id={popoverId} ref={panelRef} role="dialog">
          <div className="text-sm font-black" id={`${popoverId}-title`}>{title}</div>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p>
          <form action={action} className="mt-3 flex flex-wrap justify-end gap-2">
            {children}
            <button className="min-h-9 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" onClick={() => setOpen(false)} type="button">Abbrechen</button>
            <button className="min-h-9 rounded-lg bg-[var(--danger)] px-3 py-2 text-xs font-black text-white" type="submit">{confirmLabel}</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function ConfirmPopoverButton({ action, confirmLabel = "Bestätigen", description, name, title, triggerClassName = "min-h-9 rounded-lg border border-[var(--danger)] px-3 py-2 text-xs font-black text-[var(--danger)]", triggerLabel, value }: ConfirmPopoverButtonProps) {
  const { containerRef, open, panelRef, popoverId, setOpen, triggerRef } = useConfirmPopover();

  return (
    <div className="relative" ref={containerRef}>
      <button aria-controls={popoverId} aria-expanded={open} aria-haspopup="dialog" className={triggerClassName} onClick={() => setOpen((current) => !current)} ref={triggerRef} type="button">{triggerLabel}</button>
      {open ? (
        <div aria-labelledby={`${popoverId}-title`} className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-card)]" id={popoverId} ref={panelRef} role="dialog">
          <div className="text-sm font-black" id={`${popoverId}-title`}>{title}</div>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button className="min-h-9 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" onClick={() => setOpen(false)} type="button">Abbrechen</button>
            <button className="min-h-9 rounded-lg bg-[var(--danger)] px-3 py-2 text-xs font-black text-white" formAction={action} name={name} type="submit" value={value}>{confirmLabel}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function useConfirmPopover() {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const firstFocusable = [...(panelRef.current?.querySelectorAll<HTMLElement>("button, input, select, textarea, [tabindex]:not([tabindex='-1'])") ?? [])]
      .find((element) => !element.hasAttribute("disabled") && !(element instanceof HTMLInputElement && element.type === "hidden"));
    firstFocusable?.focus();
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      trigger?.focus();
    };
  }, [open]);

  return { containerRef, open, panelRef, popoverId, setOpen, triggerRef };
}
