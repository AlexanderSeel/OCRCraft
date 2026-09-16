"use client";

import { useState, useTransition, type DragEvent, type ReactNode } from "react";

interface TrainingItemReorderZoneProps {
  readonly sessionId: string;
  readonly phaseId: string;
  readonly itemIds: readonly string[];
  readonly action: (formData: FormData) => Promise<void>;
  readonly children: ReactNode;
}

export function TrainingItemReorderZone({
  sessionId,
  phaseId,
  itemIds,
  action,
  children,
}: TrainingItemReorderZoneProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    const handle = (event.target as HTMLElement).closest<HTMLElement>("[data-training-drag-id]");
    const itemId = handle?.dataset.trainingDragId;
    if (!itemId) return;

    setDraggedId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-training-drop-id]");
    const targetId = target?.dataset.trainingDropId;
    if (!targetId || !draggedId || targetId === draggedId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetId(targetId);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-training-drop-id]");
    const sourceId = draggedId ?? event.dataTransfer.getData("text/plain");
    const targetId = target?.dataset.trainingDropId;
    if (!sourceId || !targetId || sourceId === targetId) {
      clearDragState();
      return;
    }

    event.preventDefault();
    const remaining = itemIds.filter((id) => id !== sourceId);
    const targetIndex = remaining.indexOf(targetId);
    if (targetIndex < 0) {
      clearDragState();
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const insertAfter = event.clientY > targetRect.top + targetRect.height / 2;
    remaining.splice(targetIndex + (insertAfter ? 1 : 0), 0, sourceId);
    if (remaining.every((id, index) => id === itemIds[index])) {
      clearDragState();
      return;
    }

    const formData = new FormData();
    formData.set("sessionId", sessionId);
    formData.set("phaseId", phaseId);
    formData.set("orderedItemIds", JSON.stringify(remaining));
    startTransition(async () => {
      await action(formData);
      clearDragState();
    });
  }

  function clearDragState() {
    setDraggedId(null);
    setDropTargetId(null);
  }

  return (
    <div
      aria-busy={isPending}
      className="relative grid gap-3"
      data-drop-target={dropTargetId ?? undefined}
      onDragEnd={clearDragState}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
    >
      {isPending ? (
        <div className="sticky top-2 z-10 justify-self-end rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-bold shadow-[var(--shadow-card)]">
          Reihenfolge wird gespeichert…
        </div>
      ) : null}
      {children}
    </div>
  );
}
