"use client";

import { useState } from "react";

export function OrphanedMediaCleanupForm({
  action,
  count,
}: {
  readonly action: () => Promise<void>;
  readonly count: number;
}) {
  const [confirming, setConfirming] = useState(false);
  if (count <= 0) return null;

  if (!confirming) {
    return (
      <button
        className="min-h-10 rounded-lg border border-[var(--danger)] px-3 text-xs font-black text-[var(--danger)]"
        onClick={() => setConfirming(true)}
        type="button"
      >
        {count} verwaiste Objekte bereinigen
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-[var(--danger)]">
        Wirklich nur nicht referenzierte Storage-Objekte löschen?
      </span>
      <button
        className="min-h-10 rounded-lg bg-[var(--danger)] px-3 text-xs font-black text-white"
        type="submit"
      >
        Ja, bereinigen
      </button>
      <button
        className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-xs font-black"
        onClick={() => setConfirming(false)}
        type="button"
      >
        Abbrechen
      </button>
    </form>
  );
}
