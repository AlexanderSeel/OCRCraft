"use client";

import { useMemo, useState } from "react";
import type { AppUser, UserRole } from "@/server/auth/identity-service";
import { Dialog } from "@/components/ui/dialog";
import { IdentityLoginDialog } from "./identity-login-dialog";

type Action = (formData: FormData) => Promise<void>;

export function IdentityManagementPanel({ users, createAction, updateAction, loginAction, logoutAction }: {
  readonly users: readonly AppUser[];
  readonly createAction: Action;
  readonly updateAction: Action;
  readonly loginAction: Action;
  readonly logoutAction: Action;
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AppUser | null>(null);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return users;
    return users.filter((user) => [user.displayName, user.email, user.education, user.specialties].filter(Boolean).join(" ").toLocaleLowerCase().includes(normalized));
  }, [query, users]);

  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div><div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Identität und Betrieb</div><h2 className="mt-1 text-xl font-black">Benutzer & Profile</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Profile werden in Trainings als kompakte Trainerkarte angezeigt. Readonly-Trainingslinks bleiben ohne Anmeldung teilbar.</p></div>
      <div className="flex items-center gap-2"><IdentityLoginDialog action={loginAction} /><form action={logoutAction}><button className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-xs font-black" type="submit">Abmelden</button></form></div>
    </div>
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-black">Vereinsmitglieder</h3><p className="mt-1 text-sm text-[var(--muted)]">{filtered.length} von {users.length} Profilen</p></div><label className="grid gap-1 text-xs font-black">Filtern<input aria-label="Benutzer filtern" className="min-h-10 w-64 max-w-full rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 text-sm font-normal" onChange={(event) => setQuery(event.target.value)} placeholder="Name, E-Mail, Schwerpunkt …" value={query} /></label></div>
      <form action={createAction} className="mt-5 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <label className="grid gap-1 text-xs font-black">Name<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" name="displayName" required /></label>
        <label className="grid gap-1 text-xs font-black">E-Mail<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" name="email" required type="email" /></label>
        <label className="grid gap-1 text-xs font-black">Startpasswort<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" minLength={8} name="password" required type="password" /></label>
        <label className="grid gap-1 text-xs font-black">Rolle<select className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" defaultValue="trainer" name="role"><option value="trainer">Trainer</option><option value="admin">Admin</option><option value="super_admin">Super-Admin</option></select></label>
        <button className="min-h-10 rounded-lg bg-[var(--control-strong)] px-3 text-xs font-black text-[var(--control-strong-foreground)] md:col-span-4 md:justify-self-end" type="submit">Benutzer anlegen</button>
      </form>
      <div className="mt-5 grid gap-2">{filtered.map((user) => <article className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3" key={user.id}>
        {user.profileImageDataUrl || user.profileImageUri ? <img alt="" className="size-12 shrink-0 rounded-full object-cover" src={user.profileImageDataUrl ?? user.profileImageUri ?? ""} /> : <div aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--surface-elevated)] text-sm font-black">{initials(user.displayName)}</div>}
        <div className="min-w-0 flex-1"><div className="font-black">{user.displayName}</div><div className="truncate text-xs text-[var(--muted)]">{user.email}{user.education ? ` · ${user.education}` : ""}{user.specialties ? ` · ${user.specialties}` : ""}</div></div>
        <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-black">{roleLabel(user.role)} · {user.active ? "Aktiv" : "Inaktiv"}</span>
        <button className="min-h-9 rounded-lg border border-[var(--border)] px-3 text-xs font-black" onClick={() => setEditing(user)} type="button">Bearbeiten</button>
      </article>)}</div>
      {filtered.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">Keine Profile gefunden.</p> : null}
    </section>
    {editing ? <Dialog eyebrow="Identität" onClose={() => setEditing(null)} title={`Profil bearbeiten: ${editing.displayName}`}>
      <form action={updateAction} className="grid gap-3" encType="multipart/form-data">
        <input name="id" type="hidden" value={editing.id} />
        <label className="grid gap-1 text-sm font-bold">Anzeigename<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.displayName} name="displayName" required /></label>
        <label className="grid gap-1 text-sm font-bold">Ausbildung<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.education ?? ""} name="education" /></label>
        <label className="grid gap-1 text-sm font-bold">Schwerpunkte<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.specialties ?? ""} name="specialties" /></label>
        <label className="grid gap-1 text-sm font-bold">Kurzprofil<textarea className="min-h-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm font-normal" defaultValue={editing.bio ?? ""} name="bio" /></label>
        <label className="grid gap-1 text-sm font-bold">Profilbild hochladen<input accept="image/jpeg,image/png,image/webp" className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm font-normal" name="profileImage" type="file" /><span className="text-xs font-normal text-[var(--muted)]">JPEG, PNG oder WebP · maximal 2 MB</span></label>
        <label className="grid gap-1 text-sm font-bold">Profilbild-URL<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.profileImageUri ?? ""} name="profileImageUri" /></label>
        <label className="grid gap-1 text-sm font-bold">Rolle<select className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.role} name="role"><option value="trainer">Trainer</option><option value="admin">Admin</option><option value="super_admin">Super-Admin</option></select></label>
        <label className="inline-flex items-center gap-2 text-sm font-bold"><input defaultChecked={editing.active} name="active" type="checkbox" />Aktiv</label>
        <button className="min-h-11 rounded-lg bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">Profil speichern</button>
      </form>
    </Dialog> : null}
  </section>;
}

function initials(name: string): string { const parts = name.trim().split(/\s+/).filter(Boolean); return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : parts[0]?.[0] ?? "?").toUpperCase(); }
function roleLabel(role: UserRole): string { return role === "super_admin" ? "Super-Admin" : role === "admin" ? "Admin" : "Trainer"; }
