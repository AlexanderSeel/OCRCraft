"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function MediaJobRefresh({ active }: { readonly active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const handle = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(handle);
  }, [active, router]);

  return (
    <p aria-live="polite" className="mt-2 text-xs text-[var(--muted)]">
      {active ? "Status wird automatisch aktualisiert." : "Keine laufenden KI-Bildjobs."}
    </p>
  );
}
