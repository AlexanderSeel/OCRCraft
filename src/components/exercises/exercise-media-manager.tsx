"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { ConfirmPopoverForm } from "@/components/ui/confirm-popover-form";
import type { ExerciseMediaChoice } from "@/server/media/media-catalog-repository";

interface ExerciseMediaManagerProps {
  readonly exerciseName: string;
  readonly choices: readonly ExerciseMediaChoice[];
  readonly selectAction: (formData: FormData) => Promise<void>;
  readonly deleteAction: (formData: FormData) => Promise<void>;
}

export function ExerciseMediaManager({ exerciseName, choices, selectAction, deleteAction }: ExerciseMediaManagerProps) {
  const [open, setOpen] = useState(false);

  if (choices.length < 2) return null;

  return (
    <>
      <button className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-black" onClick={() => setOpen(true)} type="button">
        Bilder verwalten ({choices.length})
      </button>
      {open ? (
        <Dialog eyebrow="Medienauswahl" onClose={() => setOpen(false)} size="wide" title={`${exerciseName}: Bilder verwalten`}>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Wähle das Bild, das im Katalog und in Trainingsvorschauen zuerst erscheint. Nicht-primäre Bilder können hier dauerhaft entfernt werden.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {choices.map((choice) => (
              <article className={`overflow-hidden rounded-xl border ${choice.isPrimary ? "border-[var(--accent)]" : "border-[var(--border)]"}`} key={choice.id}>
                <div className="aspect-[4/3] bg-[var(--surface-elevated)]">
                  {choice.url ? <ImageLightbox alt={`${exerciseName} · Medienauswahl`} className="h-full w-full object-contain" containerClassName="relative h-full" src={choice.url} /> : <div className="grid h-full place-items-center p-3 text-center text-xs text-[var(--muted)]">Keine Vorschau</div>}
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                    <span>{choice.sourceType === "ai_generated" ? "KI" : choice.sourceType === "external_reference" ? "Extern" : "Verein"}</span>
                    {choice.isPrimary ? <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1">Hauptbild</span> : null}
                  </div>
                  <div className="text-xs text-[var(--muted)]">{choice.reviewStatus} · {choice.generationStatus}</div>
                  <div className="flex flex-wrap gap-2">
                    <form action={selectAction}>
                      <input name="assetId" type="hidden" value={choice.id} />
                      <button className="min-h-9 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" disabled={choice.isPrimary || choice.generationStatus !== "generated"} type="submit">
                        {choice.isPrimary ? "Hauptbild" : "Als Hauptbild setzen"}
                      </button>
                    </form>
                    {!choice.isPrimary ? (
                      <ConfirmPopoverForm action={deleteAction} description="Das Bild wird aus der Übung entfernt. Das Hauptbild bleibt geschützt und kann nicht über diese Aktion gelöscht werden." title="Zusätzliches Bild löschen?" triggerLabel="Löschen">
                        <input name="assetId" type="hidden" value={choice.id} />
                      </ConfirmPopoverForm>
                    ) : <span className="self-center text-xs text-[var(--muted)]">Hauptbild zuerst ersetzen</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
