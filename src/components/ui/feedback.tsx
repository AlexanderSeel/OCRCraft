import type { ReactNode } from "react";

type FeedbackTone = "success" | "warning" | "danger" | "info";

const toneClasses: Record<FeedbackTone, string> = {
  success: "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-foreground)]",
  warning: "border-[var(--warning)] bg-[var(--warning-bg)] text-[var(--warning)]",
  danger: "border-[var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]",
  info: "border-[var(--border-strong)] bg-[var(--surface-subtle)] text-[var(--foreground)]",
};

export function Alert({ children, tone = "info" }: { readonly children: ReactNode; readonly tone?: FeedbackTone }) {
  return (
    <div aria-live={tone === "danger" ? "assertive" : "polite"} className={`rounded-xl border p-4 text-sm font-bold ${toneClasses[tone]}`} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function EmptyState({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] p-5 text-center">
      <h3 className="font-black">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{children}</div>
    </section>
  );
}
