"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/form";

interface Issue { id: string; title: string; status: string; progress: number; message: string | null; createdAt: string; source: "task" | "media"; }
interface Summary { queued: number; running: number; failed: number; issues: Issue[]; }

export function QueueStatusIndicator() {
  const [summary, setSummary] = useState<Summary>({ queued: 0, running: 0, failed: 0, issues: [] });
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    const load = () => fetch("/api/queue/status", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Summary> : null).then((value) => { if (alive && value) setSummary(value); }).catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 5000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => { if (!panelRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const active = summary.queued + summary.running;
  if (!active && !summary.failed) return null;
  return <div className="relative" ref={panelRef}>
    <button aria-expanded={open} aria-haspopup="dialog" aria-label="Hintergrundaufgaben anzeigen" className={buttonClass("secondary", "min-h-9 gap-2 px-3 text-xs shadow-sm")} onClick={() => setOpen((value) => !value)} type="button">
      <span aria-hidden="true" className={`size-2 rounded-full ${summary.failed ? "bg-[var(--danger)]" : "bg-[var(--accent)]"}`} />
      {active ? `${active} aktiv` : `${summary.failed} Fehler`}
    </button>
    {open ? <div aria-label="Details der Hintergrundaufgaben" className="fixed right-4 top-16 z-[1000] w-[min(30rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-sm shadow-[var(--shadow-raised)]" role="dialog">
      <div className="flex items-start justify-between gap-4"><div><h2 className="font-black">Hintergrundaufgaben</h2><p className="mt-1 text-xs text-[var(--muted)]">{summary.running} läuft · {summary.queued} wartet · {summary.failed} Fehler</p></div><button aria-label="Details schließen" className={buttonClass("secondary", "min-h-8 px-2 py-1 text-xs")} onClick={() => setOpen(false)} type="button">×</button></div>
      <div className="mt-3 grid max-h-[min(65vh,30rem)] gap-2 overflow-y-auto pr-1">{summary.issues.length ? summary.issues.map((issue) => <article className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-3" key={`${issue.source}-${issue.id}`}><div className="flex items-start justify-between gap-3"><h3 className="font-black">{issue.title}</h3><span className="shrink-0 text-xs font-black">{issue.progress}%</span></div><dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs"><dt className="text-[var(--muted)]">Quelle</dt><dd>{issue.source === "media" ? "Medienjob" : "Systemaufgabe"}</dd><dt className="text-[var(--muted)]">Status</dt><dd>{issue.status}</dd><dt className="text-[var(--muted)]">Erstellt</dt><dd>{issue.createdAt}</dd></dl>{issue.message ? <p className="mt-2 break-words rounded-md border border-[var(--danger)] bg-[var(--danger-bg)] p-2 text-xs text-[var(--danger)]">{issue.message}</p> : null}</article>) : <p className="text-xs text-[var(--muted)]">Keine Detaildaten verfügbar.</p>}</div>
      <Link className="mt-3 inline-flex text-xs font-black underline" href="/admin?tab=queue" onClick={() => setOpen(false)}>Queue öffnen</Link>
    </div> : null}
  </div>;
}
