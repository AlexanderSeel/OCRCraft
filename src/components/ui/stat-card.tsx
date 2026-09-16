interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_8px_30px_rgba(20,28,35,0.035)]">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
      <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
    </article>
  );
}
