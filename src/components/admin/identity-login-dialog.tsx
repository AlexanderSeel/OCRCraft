"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";

export function IdentityLoginDialog({ action }: { readonly action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black" onClick={() => setOpen(true)} type="button">Anmelden</button>
    {open ? <Dialog eyebrow="Identität" onClose={() => setOpen(false)} title="Vereinskonto anmelden">
      <form action={action} className="grid gap-3">
        <p className="text-sm leading-6 text-[var(--muted)]">Melde dich mit E-Mail oder Username und Passwort an. Der Vereinszugangscode ist nur als lokaler Bootstrap-Fallback vorgesehen.</p>
        <label className="grid gap-1 text-sm font-bold">E-Mail oder Username<input className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" name="identity" required /></label>
        <label className="grid gap-1 text-sm font-bold">Passwort<input className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" minLength={8} name="password" type="password" /></label>
        <label className="grid gap-1 text-sm font-bold">Optionaler Vereinszugangscode<input className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" name="code" type="password" /></label>
        <button className="min-h-11 rounded-lg bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">Anmelden</button>
      </form>
    </Dialog> : null}
  </>;
}
