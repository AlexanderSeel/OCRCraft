"use client";

import { useCallback, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { buttonClass } from "@/components/ui/form";

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
      <button aria-expanded={open} className={buttonClass("secondary", "min-h-11 w-full justify-between rounded-xl bg-[var(--surface-subtle)] px-3 text-left text-sm hover:border-[var(--focus)]")} onClick={() => setOpen(true)} type="button">
        <span>{title}{count ? ` · ${count} gewählt` : ""}</span><span aria-hidden="true">⌄</span>
      </button>
      {open ? <Dialog onClose={close} title={title} eyebrow="Übungsfilter"><div className="max-h-[70vh] overflow-y-auto">{children}</div></Dialog> : null}
    </>
  );
}
