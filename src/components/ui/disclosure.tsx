export function Disclosure({
  summary,
  children,
  className = "",
  summaryClassName = "",
  open,
}: {
  readonly summary: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly summaryClassName?: string;
  readonly open?: boolean;
}) {
  return (
    <details className={className} open={open}>
      <summary className={summaryClassName}>{summary}</summary>
      {children}
    </details>
  );
}
