export const buttonBaseClass = "inline-flex min-h-11 items-center justify-center rounded-md px-3.5 text-sm font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-60";

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

/** Stacked title/description choices retain the shared button states. */
export function choiceButtonClass(variant: keyof typeof buttonVariantClass = "secondary", className = "") {
  return buttonClass(variant, `flex-col items-start gap-1 rounded-md p-4 text-left ${className}`);
}

export const formControlClass = [
  "min-h-11 w-full rounded-md border border-[var(--border-strong)]",
  "bg-[var(--surface)] px-3 text-sm font-normal text-[var(--foreground)]",
  "outline-none transition",
  "focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20",
  "aria-invalid:border-[var(--danger)] aria-invalid:ring-2 aria-invalid:ring-[var(--danger)]/15",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

