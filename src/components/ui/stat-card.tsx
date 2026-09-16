interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
      <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
    </article>
  );
}
