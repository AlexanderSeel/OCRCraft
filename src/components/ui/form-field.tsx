"use client";

import { cloneElement, useId, useLayoutEffect, useRef, useState, type AriaAttributes, type ReactElement, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import { buttonClass } from "./form-styles";

interface FieldControlProps extends AriaAttributes { readonly id?: string; }

/** One native control per field; labels, descriptions and errors have separate identities. */
export function FormField({ label, hint, error, required = false, children, className = "" }: {
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly required?: boolean;
  readonly children: ReactElement<FieldControlProps>;
  readonly className?: string;
}) {
  const generatedId = useId();
  const controlId = children.props.id ?? `${generatedId}-control`;
  const hintId = `${generatedId}-hint`;
  const errorId = `${generatedId}-error`;
  if (!["input", "select", "textarea"].includes(String(children.type))) {
    throw new Error("FormField requires one native input, select or textarea.");
  }
  const descriptions = [...new Set([
    ...(children.props["aria-describedby"] ?? "").split(/\s+/),
    hint ? hintId : "", error ? errorId : "",
  ].filter(Boolean))].join(" ") || undefined;
  return (
    <div className={`grid gap-1 text-sm font-bold ${className}`}>
      <div className="flex min-w-0 items-center gap-1">
        <label htmlFor={controlId}>{label}{required ? <span aria-hidden="true" className="required-field-marker ml-1 text-[var(--danger)]">*</span> : null}</label>
        {hint ? <FieldHint id={hintId} label={label}>{hint}</FieldHint> : null}
      </div>
      {cloneElement(children, { id: controlId, "aria-describedby": descriptions, "aria-invalid": error ? true : children.props["aria-invalid"] })}
      {error ? <span className="text-xs font-semibold leading-5 text-[var(--danger)]" id={errorId} role="alert">{error}</span> : null}
    </div>
  );
}

export function FieldHint({ children, id, label }: { readonly children: ReactNode; readonly id?: string; readonly label?: ReactNode }) {
  const generatedId = useId();
  const hintId = id ?? generatedId;
  const { dictionary } = useLocale();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);

  function placeHint() {
    if (!trigger.current || !popup.current) return;
    const anchor = trigger.current.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 32);
    const height = popup.current.getBoundingClientRect().height;
    const left = Math.max(16, Math.min(anchor.left, window.innerWidth - width - 16));
    const below = anchor.bottom + 8;
    const top = below + height <= window.innerHeight - 16 ? below : Math.max(16, anchor.top - height - 8);
    Object.assign(popup.current.style, { width: `${width}px`, left: `${left}px`, top: `${top}px` });
  }

  useLayoutEffect(() => {
    if (!open) return;
    placeHint();
    window.addEventListener("resize", placeHint);
    window.addEventListener("scroll", placeHint, true);
    return () => {
      window.removeEventListener("resize", placeHint);
      window.removeEventListener("scroll", placeHint, true);
    };
  }, [open]);

  return (
    <>
      <button aria-controls={hintId} aria-describedby={hintId} aria-expanded={open} className={buttonClass("ghost", "size-11 shrink-0 p-0")} onClick={placeHint} popoverTarget={hintId} ref={trigger} type="button">
        <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border border-[var(--border)] text-[11px] text-[var(--muted)]">i</span>
        <span className="sr-only">{dictionary.fieldHint}{label ? <>: {label}</> : null}</span>
      </button>
      <div className="fixed m-0 max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-3 py-2 text-xs font-normal leading-5 text-[var(--foreground)] shadow-[var(--shadow-card)]" id={hintId} onToggle={(event) => setOpen(event.newState === "open")} popover="auto" ref={popup} role="tooltip" style={{ inset: "auto" }}>
        {children}
      </div>
    </>
  );
}
