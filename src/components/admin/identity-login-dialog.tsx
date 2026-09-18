"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";

export function IdentityLoginDialog({ action }: { readonly action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black" onClick={() => setOpen(true)} type="button">Anmelden</button>
    {open ? <Dialog eyebrow="Identität" onClose={() => setOpen(false)} title="Vereinskonto anmelden">
      <form action={action} className="grid gap-3">
        <p className="text-sm leading-6 text-[var(--muted)]">Melde dich mit deiner im Adminbereich angelegten E-Mail und dem Vereinszugangscode an.</p>
        <label className="grid gap-1 text-sm font-bold">E-Mail<input className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" name="email" required type="email" /></label>
        <label className="grid gap-1 text-sm font-bold">Zugangscode<input className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" name="code" required type="password" /></label>
        <button className="min-h-11 rounded-lg bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">Anmelden</button>
      </form>
    </Dialog> : null}
  </>;
}
