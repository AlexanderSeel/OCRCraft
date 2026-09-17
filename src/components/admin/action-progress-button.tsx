"use client";

import { useFormStatus } from "react-dom";

export function ActionProgressButton({
  children,
  pendingLabel,
  className,
  name,
  value,
}: {
  readonly children: React.ReactNode;
  readonly pendingLabel: string;
  readonly className: string;
  readonly name?: string;
  readonly value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <>
      <button aria-disabled={pending} className={className} disabled={pending} name={name} type="submit" value={value}>
        {pending ? "Wird ausgeführt …" : children}
      </button>
      {pending ? (
        <span aria-live="polite" className="flex min-w-52 items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]"><span className="block h-full w-2/5 animate-pulse rounded-full bg-[var(--control-strong)]" /></span>
          {pendingLabel}
        </span>
      ) : null}
    </>
  );
}
