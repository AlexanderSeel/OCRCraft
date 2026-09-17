"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TRAINING_DETAIL_PATTERN = /^\/training\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

/**
 * Contextual shortcut shown only on a concrete saved training. The builder
 * itself decides whether generation history is available and never overwrites
 * the source session.
 */
export function TrainingBuilderResumeLink() {
  const pathname = usePathname();
  const match = TRAINING_DETAIL_PATTERN.exec(pathname);
  if (!match) return null;

  return (
    <Link
      className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-black hover:bg-[var(--surface-subtle)] sm:px-3 sm:text-sm"
      href={`/training/builder?source=${encodeURIComponent(match[1])}`}
    >
      <span className="sm:hidden">Builder</span>
      <span className="hidden sm:inline">Im Builder anpassen</span>
    </Link>
  );
}
