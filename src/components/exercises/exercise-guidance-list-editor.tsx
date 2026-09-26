"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/form";

interface MistakeRow {
  readonly mistake: string;
  readonly correction: string;
}

interface ExerciseGuidanceListEditorProps {
  readonly locale: "de" | "en";
  readonly executionSteps: readonly string[];
  readonly coachingCues: readonly string[];
  readonly commonMistakes: readonly MistakeRow[];
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly disabled?: boolean;
}

function move<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function ExerciseGuidanceListEditor({
  locale,
  executionSteps,
  coachingCues,
  commonMistakes,
  action,
  disabled = false,
}: ExerciseGuidanceListEditorProps) {
  const [steps, setSteps] = useState<string[]>(() => [...executionSteps]);
  const [cues, setCues] = useState<string[]>(() => [...coachingCues]);
  const [mistakes, setMistakes] = useState<MistakeRow[]>(() => [...commonMistakes]);
  const languageLabel = locale === "de" ? "Deutsch" : "English";

  const normalizedSteps = steps.map((item) => item.trim()).filter(Boolean);
  const normalizedCues = cues.map((item) => item.trim()).filter(Boolean);
  const normalizedMistakes = mistakes
    .map((item) => ({ mistake: item.mistake.trim(), correction: item.correction.trim() }))
    .filter((item) => item.mistake || item.correction);

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
      <input name="locale" type="hidden" value={locale} />
      <input name="executionStepsJson" type="hidden" value={JSON.stringify(normalizedSteps)} />
      <input name="coachingCuesJson" type="hidden" value={JSON.stringify(normalizedCues)} />
      <input name="commonMistakesJson" type="hidden" value={JSON.stringify(normalizedMistakes)} />

      <div>
        <div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">{languageLabel}</div>
        <h3 className="mt-1 text-lg font-black">Ausführung & Coaching</h3>
      </div>

      <EditorList
        disabled={disabled}
        items={steps}
        label="Ausführungsschritte"
        onAdd={() => setSteps((current) => [...current, ""])}
        onChange={(index, value) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))}
        onMove={(index, direction) => setSteps((current) => move(current, index, direction))}
        onRemove={(index) => setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))}
        placeholder={locale === "de" ? "z. B. Füße hüftbreit aufstellen …" : "e.g. Stand with feet hip-width apart …"}
      />

      <EditorList
        disabled={disabled}
        items={cues}
        label="Coaching-Cues"
        onAdd={() => setCues((current) => [...current, ""])}
        onChange={(index, value) => setCues((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))}
        onMove={(index, direction) => setCues((current) => move(current, index, direction))}
        onRemove={(index) => setCues((current) => current.filter((_, itemIndex) => itemIndex !== index))}
        placeholder={locale === "de" ? "Kurzer, direkt nutzbarer Trainer-Cue" : "Short coaching cue"}
      />

      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-black">Häufige Fehler & Korrektur</div>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Jeder Fehler bekommt eine konkrete, direkt coachbare Korrektur.</p>
          </div>
          <button
            className={buttonClass("secondary", "min-h-10 rounded-lg px-3 py-2 text-xs disabled:opacity-40")}
            disabled={disabled || mistakes.length >= 20}
            onClick={() => setMistakes((current) => [...current, { mistake: "", correction: "" }])}
            type="button"
          >
            + Fehler
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {mistakes.length === 0 ? <EmptyState>Keine Fehler/Korrekturen hinterlegt.</EmptyState> : null}
          {mistakes.map((item, index) => (
            <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" key={`mistake-${index}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-[var(--muted)]">#{index + 1}</span>
                <RowActions
                  disabled={disabled}
                  index={index}
                  length={mistakes.length}
                  onMove={(direction) => setMistakes((current) => move(current, index, direction))}
                  onRemove={() => setMistakes((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                />
              </div>
              <textarea
                className="min-h-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm leading-6 outline-none focus:border-[var(--focus)] disabled:opacity-60"
                disabled={disabled}
                maxLength={1000}
                onChange={(event) => setMistakes((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, mistake: event.target.value } : entry))}
                placeholder={locale === "de" ? "Typischer Fehler" : "Common mistake"}
                value={item.mistake}
              />
              <textarea
                className="min-h-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm leading-6 outline-none focus:border-[var(--focus)] disabled:opacity-60"
                disabled={disabled}
                maxLength={1000}
                onChange={(event) => setMistakes((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, correction: event.target.value } : entry))}
                placeholder={locale === "de" ? "Konkrete Korrektur" : "Concrete correction"}
                value={item.correction}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end border-t border-[var(--border)] pt-4">
        <button
          className={buttonClass("primary", "rounded-xl px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40")}
          disabled={disabled}
          type="submit"
        >
          {languageLabel} speichern
        </button>
      </div>
    </form>
  );
}

function EditorList({
  label,
  items,
  placeholder,
  disabled,
  onAdd,
  onChange,
  onMove,
  onRemove,
}: {
  readonly label: string;
  readonly items: readonly string[];
  readonly placeholder: string;
  readonly disabled: boolean;
  readonly onAdd: () => void;
  readonly onChange: (index: number, value: string) => void;
  readonly onMove: (index: number, direction: -1 | 1) => void;
  readonly onRemove: (index: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="font-black">{label}</div>
        <button
          className={buttonClass("secondary", "min-h-10 rounded-lg px-3 py-2 text-xs disabled:opacity-40")}
          disabled={disabled || items.length >= 20}
          onClick={onAdd}
          type="button"
        >
          + Eintrag
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? <EmptyState>Noch keine Einträge.</EmptyState> : null}
        {items.map((item, index) => (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" key={`${label}-${index}`}>
            <div className="pt-2 text-xs font-black text-[var(--muted)]">#{index + 1}</div>
            <div className="space-y-2">
              <textarea
                className="min-h-20 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm leading-6 outline-none focus:border-[var(--focus)] disabled:opacity-60"
                disabled={disabled}
                maxLength={1000}
                onChange={(event) => onChange(index, event.target.value)}
                placeholder={placeholder}
                value={item}
              />
              <RowActions
                disabled={disabled}
                index={index}
                length={items.length}
                onMove={(direction) => onMove(index, direction)}
                onRemove={() => onRemove(index)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RowActions({
  index,
  length,
  disabled,
  onMove,
  onRemove,
}: {
  readonly index: number;
  readonly length: number;
  readonly disabled: boolean;
  readonly onMove: (direction: -1 | 1) => void;
  readonly onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        aria-label="Eintrag nach oben verschieben"
        className={buttonClass("secondary", "min-h-10 rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-30")}
        disabled={disabled || index === 0}
        onClick={() => onMove(-1)}
        type="button"
      >
        ↑
      </button>
      <button
        aria-label="Eintrag nach unten verschieben"
        className={buttonClass("secondary", "min-h-10 rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-30")}
        disabled={disabled || index === length - 1}
        onClick={() => onMove(1)}
        type="button"
      >
        ↓
      </button>
      <button
        className={buttonClass("danger", "min-h-10 rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-30")}
        disabled={disabled}
        onClick={onRemove}
        type="button"
      >
        Entfernen
      </button>
    </div>
  );
}

function EmptyState({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-3 text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}
