import type { ReactNode } from "react";

export const formControlClass = [
  "min-h-11 w-full rounded-xl border border-[var(--border-strong)]",
  "bg-[var(--surface)] px-3 text-sm text-[var(--foreground)]",
  "outline-none transition",
  "focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20",
  "aria-invalid:border-[var(--danger)] aria-invalid:ring-2 aria-invalid:ring-[var(--danger)]/15",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

export function FormField({
  label,
  hint,
  error,
  required = false,
  children,
  className = "",
}: {
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly required?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <label className={`grid gap-1.5 text-sm font-bold ${className}`}>
      <span>
        {label}
        {required ? <span aria-hidden="true" className="required-field-marker ml-1 text-[var(--danger)]">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="text-xs font-semibold leading-5 text-[var(--danger)]" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs font-normal leading-5 text-[var(--muted)]">{hint}</span>
      ) : null}
    </label>
  );
}

export function FormMessage({
  children,
  tone = "info",
}: {
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

  return (
    <div className={`rounded-xl border p-4 text-sm font-semibold leading-6 ${toneClass}`} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function FormActions({
  children,
  className = "",
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-4 ${className}`}>
      {children}
    </div>
  );
}

export function PrimaryFormButton({
  children,
  disabled = false,
  type = "submit",
}: {
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly type?: "button" | "submit";
}) {
  return (
    <button
      className="min-h-11 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}
