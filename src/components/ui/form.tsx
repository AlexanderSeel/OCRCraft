import type { ReactNode } from "react";
import { buttonClass } from "./form-styles";

export { buttonBaseClass, buttonVariantClass, buttonClass, choiceButtonClass, formControlClass } from "./form-styles";
export { FormField, FieldHint } from "./form-field";

export function FormMessage({ children, tone = "info" }: {
  readonly children: ReactNode;
  readonly tone?: "info" | "success" | "warning" | "danger";
}) {
  const toneClass = tone === "success"
    ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-foreground)]"
    : tone === "warning"
      ? "border-[var(--warning)] bg-[var(--warning-bg)] text-[var(--warning)]"
      : tone === "danger"
        ? "border-[var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]"
        : "border-[var(--border-strong)] bg-[var(--surface-subtle)] text-[var(--foreground)]";

  return <div className={`rounded-md border p-3 text-sm font-semibold leading-6 ${toneClass}`} role={tone === "danger" ? "alert" : "status"}>{children}</div>;
}

export function FormActions({ children, className = "" }: { readonly children: ReactNode; readonly className?: string }) {
  return <div className={`flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-3 ${className}`}>{children}</div>;
}

export function PrimaryFormButton({ children, disabled = false, type = "submit" }: {
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly type?: "button" | "submit";
}) {
  return <button className={buttonClass("primary", "px-4")} disabled={disabled} type={type}>{children}</button>;
}
