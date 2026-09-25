"use client";

import { ConfirmPopoverForm } from "@/components/ui/confirm-popover-form";

export function OrphanedMediaCleanupForm({
  action,
  count,
}: {
  readonly action: () => Promise<void>;
  readonly count: number;
}) {
  if (count <= 0) return null;
  return <ConfirmPopoverForm action={action} description={`Es werden ausschließlich ${count} Storage-Objekte gelöscht, die von keinem Medienasset mehr referenziert werden.`} title="Nicht referenzierte Medien löschen?" triggerLabel={`${count} verwaiste Objekte bereinigen`} />;
}
