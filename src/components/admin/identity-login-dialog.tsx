"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { buttonClass, formControlClass } from "@/components/ui/form";

export function IdentityLoginDialog({ action }: { readonly action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className={buttonClass("secondary", "min-h-10 px-3 text-xs")} onClick={() => setOpen(true)} type="button">Anmelden</button>
    {open ? <Dialog eyebrow="Identität" onClose={() => setOpen(false)} title="Vereinskonto anmelden">
      <form action={action} className="grid gap-3">
        <p className="text-sm leading-6 text-[var(--muted)]">Melde dich mit E-Mail oder Username und Passwort an. Der Vereinszugangscode ist nur als lokaler Bootstrap-Fallback vorgesehen.</p>
        <label className="grid gap-1 text-sm font-bold">E-Mail oder Username<input className={formControlClass} name="identity" required /></label>
        <label className="grid gap-1 text-sm font-bold">Passwort<input className={formControlClass} minLength={8} name="password" type="password" /></label>
        <label className="grid gap-1 text-sm font-bold">Optionaler Vereinszugangscode<input className={formControlClass} name="code" type="password" /></label>
        <button className={buttonClass("primary", "px-4")} type="submit">Anmelden</button>
      </form>
    </Dialog> : null}
  </>;
}
