import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ActionProgressButton } from "@/components/admin/action-progress-button";
import { ConfirmPopoverForm } from "@/components/ui/confirm-popover-form";
import { buttonClass, formControlClass } from "@/components/ui/form";
import { TRAINER_QUALIFICATION_LABELS, TRAINER_QUALIFICATION_LEVELS } from "@/domain/training/trainer-qualification";
import { listAppUsers } from "@/server/auth/identity-service";
import { deleteUserAction, setUserPasswordAction, updateUserAction } from "../../../identity-actions";

export const dynamic = "force-dynamic";

type UserEditField = "email" | "role" | "username" | "firstName" | "lastName" | "education" | "trainerQualificationLevel" | "bio" | "specialties" | "profileImage" | "profileImageUri";
type FieldErrors = Partial<Record<UserEditField, string>>;

export default async function EditUserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; field?: string; saved?: string }> }) {
  const [{ id }, query, users] = await Promise.all([params, searchParams, listAppUsers()]);
  const user = users.find((item) => item.id === id);
  if (!user) return <AppShell title="Benutzer nicht gefunden" subtitle="Das Profil ist nicht mehr vorhanden."><Link className={buttonClass("secondary", "px-4")} href="/admin?tab=users">Zurück zu Benutzer & Profile</Link></AppShell>;

  const fieldErrors = getFieldErrors(query.error, query.field);
  const firstErrorField = Object.keys(fieldErrors)[0] as UserEditField | undefined;
  return <AppShell title={`Profil bearbeiten: ${user.firstName} ${user.lastName}`} subtitle="Alle Identitäts- und Zugriffsänderungen werden serverseitig geprüft.">
    <div className="mx-auto max-w-3xl space-y-5">
      <Link className={buttonClass("secondary", "px-3 text-sm")} href="/admin?tab=users">← Benutzer & Profile</Link>
      {query.error ? <p aria-live="assertive" className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]">{errorMessage(query.error, firstErrorField)}</p> : null}
      {query.saved ? <p aria-live="polite" className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm font-bold text-[var(--success-foreground)]">{query.saved === "password" ? "Passwort wurde gesetzt." : "Profil wurde gespeichert."}</p> : null}
      <form action={updateUserAction} className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <input name="id" type="hidden" value={user.id} />
        <Field error={fieldErrors.firstName} label="Vorname" name="firstName" value={user.firstName} required />
        <Field error={fieldErrors.lastName} label="Nachname" name="lastName" value={user.lastName} required />
        <Field error={fieldErrors.username} hint="3–40 Zeichen: Buchstaben, Zahlen, Punkt, Unterstrich oder Bindestrich." label="Username" name="username" value={user.username} required pattern="[A-Za-z0-9._-]{3,40}" />
        <Field error={fieldErrors.email} label="E-Mail" name="email" value={user.email} required type="email" />
        <SelectField error={fieldErrors.role} label="Rolle" name="role" value={user.role} options={[["trainer", "Trainer"], ["admin", "Admin"], ["super_admin", "Super-Admin"]]} />
        <SelectField error={fieldErrors.trainerQualificationLevel} label="Qualifikationslevel" name="trainerQualificationLevel" value={user.trainerQualificationLevel} options={TRAINER_QUALIFICATION_LEVELS.map((level) => [level, TRAINER_QUALIFICATION_LABELS[level]] as const)} />
        <Field error={fieldErrors.education} label="Ausbildung" name="education" value={user.education ?? ""} />
        <Field error={fieldErrors.specialties} label="Schwerpunkte" name="specialties" value={user.specialties ?? ""} />
        <TextAreaField error={fieldErrors.bio} label="Kurzprofil" name="bio" value={user.bio ?? ""} />
        <FileField error={fieldErrors.profileImage} />
        <Field error={fieldErrors.profileImageUri} label="Profilbild-URL" name="profileImageUri" value={user.profileImageUri ?? ""} />
        <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input defaultChecked={user.active} name="active" type="checkbox" /> Benutzer aktiv</label>
        <ActionProgressButton className={buttonClass("primary", "px-4 sm:col-span-2")} pendingLabel="Profil wird gespeichert …">Änderungen speichern</ActionProgressButton>
      </form>
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"><h2 className="text-lg font-black">Zugang verwalten</h2><form action={setUserPasswordAction} className="mt-3 flex flex-wrap items-end gap-3"><input name="id" type="hidden" value={user.id} /><label className="grid min-w-60 flex-1 gap-1 text-sm font-bold">Neues Passwort<input className={`${formControlClass} font-normal`} minLength={8} name="password" required type="password" /></label><ActionProgressButton className={buttonClass("secondary", "px-4")} pendingLabel="Passwort wird gesetzt …">Passwort setzen</ActionProgressButton></form><div className="mt-5 border-t border-[var(--border)] pt-4"><ConfirmPopoverForm action={deleteUserAction} description={`Der Zugang „${user.displayName}“ wird dauerhaft gelöscht.`} title="Benutzer löschen?" triggerLabel="Benutzer löschen"><input name="id" type="hidden" value={user.id} /></ConfirmPopoverForm></div></section>
    </div>
  </AppShell>;
}

function Field({ error, hint, label, name, value, required = false, pattern, type = "text" }: { error?: string; hint?: string; label: string; name: UserEditField; value: string; required?: boolean; pattern?: string; type?: string }) {
  const inputId = `user-${name}`;
  const errorId = `${inputId}-error`;
  return <label className="grid gap-1 text-sm font-bold" htmlFor={inputId}>{label}<input aria-describedby={error ? errorId : undefined} aria-invalid={error ? "true" : undefined} className={controlClass(error)} defaultValue={value} id={inputId} name={name} pattern={pattern} required={required} type={type} />{hint ? <span className="text-xs font-normal text-[var(--muted)]">{hint}</span> : null}<FieldError id={errorId} message={error} /></label>;
}

function SelectField({ error, label, name, options, value }: { error?: string; label: string; name: UserEditField; options: readonly (readonly [string, string])[]; value: string }) {
  const inputId = `user-${name}`;
  return <label className="grid gap-1 text-sm font-bold" htmlFor={inputId}>{label}<select aria-describedby={error ? `${inputId}-error` : undefined} aria-invalid={error ? "true" : undefined} className={controlClass(error)} defaultValue={value} id={inputId} name={name}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><FieldError id={`${inputId}-error`} message={error} /></label>;
}

function TextAreaField({ error, label, name, value }: { error?: string; label: string; name: UserEditField; value: string }) {
  const inputId = `user-${name}`;
  return <label className="grid gap-1 text-sm font-bold sm:col-span-2" htmlFor={inputId}>{label}<textarea aria-describedby={error ? `${inputId}-error` : undefined} aria-invalid={error ? "true" : undefined} className={`${controlClass(error)} min-h-28 py-3`} defaultValue={value} id={inputId} name={name} /><FieldError id={`${inputId}-error`} message={error} /></label>;
}

function FileField({ error }: { error?: string }) {
  const inputId = "user-profileImage";
  return <label className="grid gap-1 text-sm font-bold" htmlFor={inputId}>Profilbild hochladen<input accept="image/jpeg,image/png,image/webp" aria-describedby={`${inputId}-hint${error ? ` ${inputId}-error` : ""}`} aria-invalid={error ? "true" : undefined} className={controlClass(error)} id={inputId} name="profileImage" type="file" /><span className="text-xs font-normal text-[var(--muted)]" id={`${inputId}-hint`}>JPEG, PNG oder WebP, maximal 2 MB</span><FieldError id={`${inputId}-error`} message={error} /></label>;
}

function FieldError({ id, message }: { id: string; message?: string }) { return message ? <span className="field-error text-sm font-semibold text-[var(--danger)]" id={id} role="alert">{message}</span> : null; }
function controlClass(error?: string) { return `${formControlClass} ${error ? "border-[var(--danger)] ring-2 ring-[color-mix(in_srgb,var(--danger)_25%,transparent)]" : "bg-[var(--surface-subtle)]"} font-normal`; }

function getFieldErrors(code?: string, field?: string): FieldErrors {
  if (code !== "invalid" || !isUserEditField(field)) return {};
  const messages: Record<UserEditField, string> = {
    email: "Bitte eine gültige E-Mail-Adresse eingeben.", role: "Bitte eine gültige Rolle auswählen.", username: "Username: 3–40 Zeichen aus Buchstaben, Zahlen, Punkt, Unterstrich oder Bindestrich.",
    firstName: "Bitte einen Vornamen eingeben.", lastName: "Bitte einen Nachnamen eingeben.", education: "Die Ausbildung darf höchstens 240 Zeichen enthalten.",
    trainerQualificationLevel: "Bitte ein gültiges Qualifikationslevel auswählen.", bio: "Das Kurzprofil darf höchstens 1.000 Zeichen enthalten.", specialties: "Die Schwerpunkte dürfen höchstens 500 Zeichen enthalten.",
    profileImage: "Bitte JPEG, PNG oder WebP bis maximal 2 MB auswählen.", profileImageUri: "Bitte eine gültige Profilbild-URL oder einen lokalen Pfad eingeben.",
  };
  return { [field]: messages[field] };
}

function isUserEditField(field?: string): field is UserEditField { return field !== undefined && ["email", "role", "username", "firstName", "lastName", "education", "trainerQualificationLevel", "bio", "specialties", "profileImage", "profileImageUri"].includes(field); }
function errorMessage(code: string, field?: UserEditField): string { if (code === "permission") return "Änderung nicht möglich: Bitte als aktiver Super-Admin anmelden. Benutzer, Rollen und Passwörter dürfen nur Super-Admins ändern."; if (code === "delete") return "Benutzer konnte nicht gelöscht werden. Prüfe Verknüpfungen und Berechtigung."; if (code === "invalid" && field) return "Bitte korrigiere das markierte Feld."; if (code === "invalid") return "Eingabe ungültig. Bitte prüfe die markierten Felder."; return "Die Änderung konnte nicht gespeichert werden."; }
