"use client";

import type { AppUser } from "@/server/auth/identity-service";
import { PERMISSION_LEVELS, PERMISSION_RESOURCES } from "@/domain/auth/permissions";
import type { AccessRole } from "@/server/auth/permission-service";
import { ActionProgressButton } from "./action-progress-button";

type Action = (formData: FormData) => Promise<void>;
const resourceLabels: Record<(typeof PERMISSION_RESOURCES)[number], string> = { training: "Trainings", exercises: "Übungen", groups: "Gruppen", games: "Spiele", obstacles: "Hindernisse", media: "Medien", reports: "Berichte", administration: "Administration" };
const levelLabels: Record<(typeof PERMISSION_LEVELS)[number], string> = { read: "Lesen", write: "Schreiben", admin: "Admin" };

export function RolePermissionsPanel({ roles, users, assignments, createAction, updateAction, deleteAction, assignAction }: { readonly roles: readonly AccessRole[]; readonly users: readonly AppUser[]; readonly assignments: Readonly<Record<string, readonly string[]>>; readonly createAction: Action; readonly updateAction: Action; readonly deleteAction: Action; readonly assignAction: Action }) {
  return <section className="space-y-5">
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Zugriffskontrolle</div>
      <h2 className="mt-1 text-xl font-black">Rollen & Rechte</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Zusätzliche Rollen ergänzen die festen Trainer-, Admin- und Super-Admin-Rechte. Die effektiven Rechte werden bei jeder Serveraktion erneut geprüft.</p>
    </div>
    <form action={createAction} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h3 className="font-black">Rolle anlegen</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-bold">Schlüssel<input className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 font-normal" name="key" pattern="[a-z][a-z0-9_-]{2,48}" required /></label><label className="grid gap-1 text-sm font-bold">Name<input className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 font-normal" name="name" required /></label></div>
      <label className="mt-3 grid gap-1 text-sm font-bold">Beschreibung<textarea className="min-h-20 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-3 font-normal" name="description" /></label>
      <PermissionGrid />
      <ActionProgressButton className="mt-4 min-h-11 rounded-lg bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" pendingLabel="Rolle wird gespeichert …">Rolle anlegen</ActionProgressButton>
    </form>
    <div className="grid gap-4">{roles.length === 0 ? <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">Noch keine benutzerdefinierten Rollen.</p> : roles.map((role) => <RoleCard deleteAction={deleteAction} key={role.id} role={role} updateAction={updateAction} />)}</div>
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6"><h3 className="font-black">Rollen zuweisen</h3><p className="mt-1 text-sm text-[var(--muted)]">Mehrere Rollen werden additiv ausgewertet. Feste Systemrollen bleiben unabhängig davon bestehen.</p><div className="mt-4 grid gap-3">{users.map((user) => <form action={assignAction} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-center" key={user.id}><input name="userId" type="hidden" value={user.id} /><div><div className="font-black">{user.displayName}</div><div className="text-xs text-[var(--muted)]">{user.email}</div></div><div className="flex flex-wrap gap-x-4 gap-y-2">{roles.map((role) => <label className="inline-flex items-center gap-2 text-xs font-bold" key={role.id}><input defaultChecked={assignments[user.id]?.includes(role.id)} name="roleId" type="checkbox" value={role.id} />{role.name}</label>)}</div><ActionProgressButton className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-xs font-black" pendingLabel="Zuweisung …">Speichern</ActionProgressButton></form>)}</div></section>
  </section>;
}

function PermissionGrid({ role }: { readonly role?: AccessRole }) {
  return <fieldset className="mt-4"><legend className="text-sm font-black">Bereichsrechte</legend><div className="mt-2 overflow-x-auto rounded-xl border border-[var(--border)]"><table className="w-full min-w-[38rem] text-left text-sm"><thead><tr className="border-b border-[var(--border)] text-xs text-[var(--muted)]"><th className="p-3">Bereich</th>{PERMISSION_LEVELS.map((level) => <th className="p-3" key={level}>{levelLabels[level]}</th>)}</tr></thead><tbody>{PERMISSION_RESOURCES.map((resource) => <tr className="border-b border-[var(--border)] last:border-0" key={resource}><th className="p-3 font-bold">{resourceLabels[resource]}</th>{PERMISSION_LEVELS.map((level) => <td className="p-3" key={level}><input defaultChecked={role?.permissions.some((grant) => grant.resource === resource && grant.level === level)} name="permission" type="checkbox" value={`${resource}:${level}`} /></td>)}</tr>)}</tbody></table></div></fieldset>;
}

function RoleCard({ role, updateAction, deleteAction }: { readonly role: AccessRole; readonly updateAction: Action; readonly deleteAction: Action }) {
  return <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6"><form action={updateAction}><input name="id" type="hidden" value={role.id} /><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{role.name}</h3><p className="text-xs text-[var(--muted)]"><code>{role.key}</code> · {role.active ? "aktiv" : "inaktiv"}</p></div><label className="inline-flex items-center gap-2 text-xs font-bold"><input defaultChecked={role.active} name="active" type="checkbox" />Aktiv</label></div><label className="mt-3 grid gap-1 text-sm font-bold">Name<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 font-normal" defaultValue={role.name} name="name" required /></label><label className="mt-3 grid gap-1 text-sm font-bold">Beschreibung<textarea className="min-h-20 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-3 font-normal" defaultValue={role.description ?? ""} name="description" /></label><PermissionGrid role={role} /><ActionProgressButton className="mt-4 min-h-10 rounded-lg border border-[var(--border)] px-3 text-xs font-black" pendingLabel="Rolle wird aktualisiert …">Änderungen speichern</ActionProgressButton></form><form action={deleteAction} className="mt-3 border-t border-[var(--border)] pt-3"><input name="id" type="hidden" value={role.id} /><button className="min-h-10 rounded-lg border border-[var(--danger)] px-3 text-xs font-black text-[var(--danger)]" type="submit">Rolle löschen</button></form></article>;
}
