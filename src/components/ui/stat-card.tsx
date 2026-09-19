import { Card } from "./card";

interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden p-4">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-[var(--brand)]" />
      <div className="ui-kicker">{label}</div>
      <div className="mt-1.5 text-2xl font-black tracking-[-0.035em]">{value}</div>
      <p className="mt-0.5 truncate text-xs text-[var(--muted)]" title={detail}>{detail}</p>
    </Card>
  );
}
