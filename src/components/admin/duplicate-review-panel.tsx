"use client";

import { useState } from "react";
import { ActionProgressButton } from "./action-progress-button";
import { Dialog } from "../ui/dialog";
import { ImageLightbox } from "../ui/image-lightbox";

interface DuplicateReviewTask {
  readonly id: string;
  readonly leftExerciseId: string;
  readonly rightExerciseId: string;
  readonly leftName: string;
  readonly rightName: string;
  readonly score: number;
  readonly classification: "same" | "new" | "probable_duplicate" | "conflict";
  readonly reasons: readonly string[];
}

interface DuplicateComparisonRecord {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly category: string;
  readonly phase: string;
  readonly riskLevel: string;
  readonly minAge: number | null;
  readonly equipment: readonly string[];
  readonly bodyRegions: readonly string[];
  readonly purpose: string;
  readonly setup: string;
  readonly safetyNotes: string;
  readonly imageUrl: string | null;
}

interface DuplicateReviewPanelProps {
  readonly tasks: readonly DuplicateReviewTask[];
  readonly comparisonRecords: Readonly<Record<string, DuplicateComparisonRecord>>;
  readonly resolveAction: (formData: FormData) => Promise<void>;
  readonly bulkAction: (formData: FormData) => Promise<void>;
}

export function DuplicateReviewPanel({ tasks, comparisonRecords, resolveAction, bulkAction }: DuplicateReviewPanelProps) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [comparison, setComparison] = useState<DuplicateReviewTask | null>(null);

  function toggle(taskId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => current.size === tasks.length ? new Set() : new Set(tasks.map((task) => task.id)));
  }

  const selectedTasks = tasks.filter((task) => selected.has(task.id));

  return (
    <>
      {tasks.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input checked={selected.size === tasks.length} onChange={toggleAll} type="checkbox" />
            Alle auswählen
          </label>
          <span className="text-xs font-semibold text-[var(--muted)]">{selected.size} ausgewählt</span>
          {selectedTasks.length > 0 ? (
            <form action={bulkAction} className="flex flex-wrap items-center gap-2">
              {selectedTasks.map((task) => <input key={task.id} name="selection" type="hidden" value={`${task.id}:${task.leftExerciseId}:${task.rightExerciseId}`} />)}
              <label className="sr-only" htmlFor="bulk-duplicate-decision">Aktion</label>
              <select className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-bold" defaultValue="left" id="bulk-duplicate-decision" name="decision">
                <option value="left">Linke übernehmen</option>
                <option value="right">Rechte übernehmen</option>
                <option value="both">Beide behalten</option>
                <option value="ignored">Ignorieren</option>
              </select>
              <ActionProgressButton className="rounded-lg bg-[var(--control-strong)] px-3 py-2 text-xs font-black text-[var(--control-strong-foreground)]" pendingLabel={`${selectedTasks.length} Einträge werden verarbeitet`}>Ausführen</ActionProgressButton>
            </form>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 grid gap-3">
        {tasks.map((task) => (
          <article
            aria-pressed={selected.has(task.id)}
            className={`cursor-pointer rounded-xl border p-3 transition-colors ${selected.has(task.id) ? "border-[var(--control-strong)] bg-[var(--surface)]" : "border-[var(--border)] bg-[var(--surface-subtle)]"}`}
            key={task.id}
            onClick={(event) => { if (!(event.target instanceof HTMLElement) || !event.target.closest("button,input,form,a")) toggle(task.id); }}
            onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) { event.preventDefault(); toggle(task.id); } }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start gap-3">
              <input aria-label={`${task.leftName} und ${task.rightName} auswählen`} checked={selected.has(task.id)} className="mt-1" onChange={() => toggle(task.id)} onClick={(event) => event.stopPropagation()} type="checkbox" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button className="text-left font-black underline-offset-2 hover:underline" onClick={() => setComparison(task)} type="button">{task.leftName} ↔ {task.rightName}</button>
                  <span className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-black">{classificationLabel(task.classification)}</span><span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-black">{Math.round(task.score * 100)} %</span></span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{task.reasons.join(" · ")}</p>
                <button className="mt-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-bold" onClick={() => setComparison(task)} type="button">Side-by-Side vergleichen</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {comparison ? (
        <Dialog eyebrow="Dublettenprüfung" onClose={() => setComparison(null)} size="wide" title="Side-by-Side-Vergleich">
            <div className="grid gap-3 md:grid-cols-2">
              {[{ name: comparison.leftName, id: comparison.leftExerciseId, primary: true }, { name: comparison.rightName, id: comparison.rightExerciseId, primary: false }].map((side) => (
                <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" key={side.id}>
                  {(() => {
                    const record = comparisonRecords[side.id];
                    return <>
                  <h4 className="text-lg font-black">{record?.name ?? side.name}</h4>
                  <p className="mt-1 break-all text-xs text-[var(--muted)]">ID: {side.id}</p>
                  {record?.imageUrl ? <ImageLightbox alt={`Vorschau: ${record.name}`} className="h-32 w-full object-contain" containerClassName="relative mt-3 overflow-hidden rounded-lg border border-[var(--border)] bg-white" src={record.imageUrl} /> : <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] p-3 text-xs text-[var(--muted)]">Kein verwendbares Bild hinterlegt.</div>}
                  {record ? (
                    <div className="mt-4 space-y-3 text-sm">
                      <p className="text-[var(--muted)]">{record.summary || "Keine Kurzbeschreibung hinterlegt."}</p>
                      <dl className="grid grid-cols-2 gap-2 text-xs"><div><dt className="text-[var(--muted)]">Bereich</dt><dd className="font-bold">{record.category}</dd></div><div><dt className="text-[var(--muted)]">Phase</dt><dd className="font-bold">{record.phase}</dd></div><div><dt className="text-[var(--muted)]">Risiko</dt><dd className="font-bold">{record.riskLevel}</dd></div><div><dt className="text-[var(--muted)]">Mindestalter</dt><dd className="font-bold">{record.minAge == null ? "–" : `${record.minAge} Jahre`}</dd></div></dl>
                      <Info label="Equipment" value={record.equipment.join(" · ") || "Keines hinterlegt"} />
                      <Info label="Körperregionen" value={record.bodyRegions.join(" · ") || "Keine hinterlegt"} />
                      <Info label="Zweck" value={record.purpose || "Nicht hinterlegt"} />
                      <Info label="Setup" value={record.setup || "Nicht hinterlegt"} />
                      <Info label="Sicherheit" value={record.safetyNotes || "Nicht hinterlegt"} />
                    </div>
                  ) : <p className="mt-4 text-sm text-[var(--muted)]">Inhalte konnten nicht geladen werden.</p>}
                  <form action={resolveAction} className="mt-4">
                    <input name="taskId" type="hidden" value={comparison.id} />
                    <input name="keepExerciseId" type="hidden" value={side.id} />
                    <button className={side.primary ? "rounded-lg bg-[var(--control-strong)] px-3 py-2 text-xs font-black text-[var(--control-strong-foreground)]" : "rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black"} type="submit">{side.primary ? "Linke behalten" : "Rechte behalten"}</button>
                  </form>
                    </>;
                  })()}
                </section>
              ))}
            </div>
            <form action={resolveAction} className="mt-3">
              <input name="taskId" type="hidden" value={comparison.id} /><input name="keepExerciseId" type="hidden" value={comparison.leftExerciseId} /><input name="status" type="hidden" value="ignored" />
              <button className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--muted)]" type="submit">Keine Dublette – ignorieren</button>
            </form>
        </Dialog>
      ) : null}
    </>
  );
}

function classificationLabel(value: DuplicateReviewTask["classification"]): string {
  return value === "same" ? "Gleich" : value === "probable_duplicate" ? "Wahrscheinliche Dublette" : value === "conflict" ? "Konflikt" : "Neu";
}

function Info({ label, value }: { readonly label: string; readonly value: string }) {
  return <div><div className="text-[11px] font-black uppercase tracking-wide text-[var(--muted)]">{label}</div><p className="mt-0.5 leading-5">{value}</p></div>;
}
