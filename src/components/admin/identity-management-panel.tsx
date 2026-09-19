"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AppUser, UserRole } from "@/server/auth/identity-service";
import {
  TRAINER_QUALIFICATION_LABELS,
  TRAINER_QUALIFICATION_LEVELS,
} from "@/domain/training/trainer-qualification";
import { Dialog } from "@/components/ui/dialog";
import { ActionProgressButton } from "@/components/admin/action-progress-button";
import { IdentityLoginDialog } from "./identity-login-dialog";

type Action = (formData: FormData) => Promise<void>;

export function IdentityManagementPanel({ users, createAction, updateAction, loginAction, logoutAction, setPasswordAction, deleteAction, saveAccessCodeAction, accessCodeConfigured }: {
  readonly users: readonly AppUser[];
  readonly createAction: Action;
  readonly updateAction: Action;
  readonly setPasswordAction: Action;
  readonly deleteAction: Action;
  readonly loginAction: Action;
  readonly logoutAction: Action;
  readonly saveAccessCodeAction: Action;
  readonly accessCodeConfigured: boolean;
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AppUser | null>(null);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return users;
    return users.filter((user) => [user.firstName, user.lastName, user.username, user.email, user.education, user.specialties].filter(Boolean).join(" ").toLocaleLowerCase().includes(normalized));
  }, [query, users]);

  return <section className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div><div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Identität und Betrieb</div><h2 className="mt-1 text-xl font-black">Benutzer & Profile</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Profile werden in Trainings als kompakte Trainerkarte angezeigt. Readonly-Trainingslinks bleiben ohne Anmeldung teilbar.</p></div>
      <div className="flex items-center gap-2"><IdentityLoginDialog action={loginAction} /><form action={logoutAction}><button className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-xs font-black" type="submit">Abmelden</button></form></div>
    </div>
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4"><h3 className="text-lg font-black">Vereinscode</h3><p className="mt-1 text-sm text-[var(--muted)]">Der Code kann alternativ zum Passwort verwendet werden. Aktueller Status: {accessCodeConfigured ? "gesetzt" : "nicht gesetzt"}.</p><form action={saveAccessCodeAction} className="mt-3 flex flex-wrap items-end gap-3"><label className="grid min-w-60 flex-1 gap-1 text-sm font-bold" htmlFor="admin-club-access-code">Neuer Vereinscode<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" id="admin-club-access-code" minLength={4} name="clubAccessCode" required type="password" /></label><ActionProgressButton className="min-h-10 rounded-lg bg-[var(--control-strong)] px-3 text-xs font-black text-[var(--control-strong-foreground)]" pendingLabel="Vereinscode wird gespeichert …">Code speichern</ActionProgressButton></form></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-black">Vereinsmitglieder</h3><p className="mt-1 text-sm text-[var(--muted)]">{filtered.length} von {users.length} Profilen</p></div><label className="grid gap-1 text-xs font-black">Filtern<input aria-label="Benutzer filtern" className="min-h-10 w-64 max-w-full rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 text-sm font-normal" onChange={(event) => setQuery(event.target.value)} placeholder="Vorname, Username, E-Mail …" value={query} /></label></div>
      <form action={createAction} className="mt-5 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <label className="grid gap-1 text-xs font-black">Vorname<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" name="firstName" required /></label>
        <label className="grid gap-1 text-xs font-black">Nachname<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" name="lastName" required /></label>
        <label className="grid gap-1 text-xs font-black">Username<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" name="username" pattern="[A-Za-z0-9._-]{3,40}" required /></label>
        <label className="grid gap-1 text-xs font-black">E-Mail<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" name="email" required type="email" /></label>
        <label className="grid gap-1 text-xs font-black">Startpasswort<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" minLength={8} name="password" required type="password" /></label>
        <label className="grid gap-1 text-xs font-black">Qualifikation<select className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" defaultValue="none" name="trainerQualificationLevel">{TRAINER_QUALIFICATION_LEVELS.map((level) => <option key={level} value={level}>{TRAINER_QUALIFICATION_LABELS[level]}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-black">Rolle<select className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" defaultValue="trainer" name="role"><option value="trainer">Trainer</option><option value="admin">Admin</option><option value="super_admin">Super-Admin</option></select></label>
        <ActionProgressButton className="min-h-10 rounded-lg bg-[var(--control-strong)] px-3 text-xs font-black text-[var(--control-strong-foreground)] md:col-span-4 md:justify-self-end" pendingLabel="Benutzer wird gespeichert …">Benutzer anlegen</ActionProgressButton>
      </form>
      <div className="mt-5 grid gap-2">{filtered.map((user) => <article className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3" key={user.id}>
        {user.profileImageDataUrl || user.profileImageUri ? <img alt="" className="size-12 shrink-0 rounded-full object-cover" src={user.profileImageDataUrl ?? user.profileImageUri ?? ""} /> : <div aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--surface-elevated)] text-sm font-black">{initials(user.displayName)}</div>}
        <div className="min-w-0 flex-1"><div className="font-black">{user.firstName} {user.lastName}</div><div className="truncate text-xs text-[var(--muted)]">@{user.username} · {user.email}{user.education ? ` · ${user.education}` : ""}{user.specialties ? ` · ${user.specialties}` : ""}</div></div>
        <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-black">{roleLabel(user.role)} · {TRAINER_QUALIFICATION_LABELS[user.trainerQualificationLevel]} · {user.active ? "Aktiv" : "Inaktiv"}</span>
        <Link className="min-h-9 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" href={`/admin/users/${user.id}/edit`}>Bearbeiten</Link>
      </article>)}</div>
      {filtered.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">Keine Profile gefunden.</p> : null}
    </section>
    {editing ? <Dialog eyebrow="Identität" onClose={() => setEditing(null)} title={`Profil bearbeiten: ${editing.firstName} ${editing.lastName}`}>
      <form action={updateAction} className="grid gap-3">
        <input name="id" type="hidden" value={editing.id} />
        <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-bold">Vorname<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.firstName} name="firstName" required /></label><label className="grid gap-1 text-sm font-bold">Nachname<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.lastName} name="lastName" required /></label></div>
        <label className="grid gap-1 text-sm font-bold">Username<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.username} name="username" pattern="[A-Za-z0-9._-]{3,40}" required /></label>
        <label className="grid gap-1 text-sm font-bold">E-Mail<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.email} name="email" required type="email" /></label>
        <label className="grid gap-1 text-sm font-bold">Qualifikationslevel<select className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.trainerQualificationLevel} name="trainerQualificationLevel">{TRAINER_QUALIFICATION_LEVELS.map((level) => <option key={level} value={level}>{TRAINER_QUALIFICATION_LABELS[level]}</option>)}</select><span className="text-xs font-normal text-[var(--muted)]">Maschinenlesbarer Level für Schutzprofile und fachliche Medienfreigaben.</span></label>
        <label className="grid gap-1 text-sm font-bold">Ausbildung<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.education ?? ""} name="education" /></label>
        <label className="grid gap-1 text-sm font-bold">Schwerpunkte<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.specialties ?? ""} name="specialties" /></label>
        <label className="grid gap-1 text-sm font-bold">Kurzprofil<textarea className="min-h-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm font-normal" defaultValue={editing.bio ?? ""} name="bio" /></label>
        <label className="grid gap-1 text-sm font-bold">Profilbild hochladen<input accept="image/jpeg,image/png,image/webp" className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm font-normal" name="profileImage" type="file" /><span className="text-xs font-normal text-[var(--muted)]">JPEG, PNG oder WebP · maximal 2 MB</span></label>
        <label className="grid gap-1 text-sm font-bold">Profilbild-URL<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.profileImageUri ?? ""} name="profileImageUri" /></label>
        <label className="grid gap-1 text-sm font-bold">Rolle<select className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" defaultValue={editing.role} name="role"><option value="trainer">Trainer</option><option value="admin">Admin</option><option value="super_admin">Super-Admin</option></select></label>
        <label className="inline-flex items-center gap-2 text-sm font-bold"><input defaultChecked={editing.active} name="active" type="checkbox" />Aktiv</label>
        <ActionProgressButton className="min-h-11 rounded-lg bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" pendingLabel="Profil wird gespeichert …">Profil speichern</ActionProgressButton>
      </form>
      <form action={setPasswordAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-4"><input name="id" type="hidden" value={editing.id} /><label className="grid min-w-56 flex-1 gap-1 text-sm font-bold">Neues Passwort<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" minLength={8} name="password" required type="password" /></label><ActionProgressButton className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-sm font-black" pendingLabel="Passwort wird gesetzt …">Passwort setzen</ActionProgressButton></form>
      <form action={deleteAction} className="mt-3"><input name="id" type="hidden" value={editing.id} /><ActionProgressButton className="min-h-10 rounded-lg border border-[var(--danger)] px-3 text-sm font-black text-[var(--danger)]" pendingLabel="Benutzer wird gelöscht …">Benutzer löschen</ActionProgressButton></form>
    </Dialog> : null}
  </section>;
}

function initials(name: string): string { const parts = name.trim().split(/\s+/).filter(Boolean); return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : parts[0]?.[0] ?? "?").toUpperCase(); }
function roleLabel(role: UserRole): string { return role === "super_admin" ? "Super-Admin" : role === "admin" ? "Admin" : "Trainer"; }
