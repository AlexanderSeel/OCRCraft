import type { ReactNode } from "react";

export function Card({ children, className = "", as = "section" }: { readonly children: ReactNode; readonly className?: string; readonly as?: "article" | "div" | "section" }) {
  const Component = as;
  return <Component className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] ${className}`.trim()}>{children}</Component>;
}

export function CardHeader({ eyebrow, title, children }: { readonly eyebrow?: ReactNode; readonly title: ReactNode; readonly children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow ? <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{eyebrow}</div> : null}
        <h2 className="mt-1 text-lg font-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}
