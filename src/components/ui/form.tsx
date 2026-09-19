import type { ReactNode } from "react";

export const buttonBaseClass = "inline-flex min-h-11 items-center justify-center rounded-md px-3.5 text-sm font-black transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const buttonVariantClass = {
  primary: "bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--brand-strong)]",
  accent: "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]",
  secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-subtle)]",
  danger: "border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-bg)]",
  ghost: "text-[var(--foreground)] hover:bg-[var(--surface-subtle)]",
} as const;

export function buttonClass(variant: keyof typeof buttonVariantClass = "primary", className = "") {
  return `${buttonBaseClass} ${buttonVariantClass[variant]} ${className}`.trim();
}

export const formControlClass = [
  "min-h-11 w-full rounded-md border border-[var(--border-strong)]",
  "bg-[var(--surface)] px-3 text-sm text-[var(--foreground)]",
  "outline-none transition",
  "focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20",
  "aria-invalid:border-[var(--danger)] aria-invalid:ring-2 aria-invalid:ring-[var(--danger)]/15",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

export function FormField({ label, hint, error, required = false, children, className = "" }: {
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly required?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <label className={`grid gap-1 text-sm font-bold ${className}`}>
      <span>{label}{required ? <span aria-hidden="true" className="required-field-marker ml-1 text-[var(--danger)]">*</span> : null}</span>
      {children}
      {error ? <span className="text-xs font-semibold leading-5 text-[var(--danger)]" role="alert">{error}</span> : hint ? <span className="text-xs font-normal leading-5 text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

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
