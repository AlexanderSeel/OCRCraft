"use client";

import { useCallback, useState } from "react";
import { Dialog } from "@/components/ui/dialog";

export function ExerciseFilterPopover({
  title,
  count,
  children,
}: {
  readonly title: string;
  readonly count?: number;
  readonly children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button aria-expanded={open} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 text-left text-sm font-black hover:border-[var(--focus)]" onClick={() => setOpen(true)} type="button">
        <span>{title}{count ? ` · ${count} gewählt` : ""}</span><span aria-hidden="true">⌄</span>
      </button>
      {open ? <Dialog onClose={close} title={title} eyebrow="Übungsfilter"><div className="max-h-[70vh] overflow-y-auto">{children}</div></Dialog> : null}
    </>
  );
}
