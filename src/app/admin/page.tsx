import { AppShell } from "@/components/app-shell";
import { SeedCompletenessReportView } from "@/components/admin/seed-completeness-report";
import { MuscleMapDebugSetting } from "@/components/admin/muscle-map-debug-setting";
import { DuplicateReviewPanel } from "@/components/admin/duplicate-review-panel";
import { ActionProgressButton } from "@/components/admin/action-progress-button";
import { Disclosure } from "@/components/ui/disclosure";
import { AdminTabs, normalizeAdminTab } from "@/components/admin/admin-tabs";
import { AiProviderSettingsPanel } from "@/components/admin/ai-provider-settings-panel";
import { getSeedCompletenessReport } from "@/server/exercises/seed-completeness-service";
import { getSearchIndexStates } from "@/server/search/search-index-service";
import { listRecentAuditEvents } from "@/server/db/audit-service";
import { listDatabaseBackups } from "@/server/db/backup-service";
import { listAiProviderSettings } from "@/server/ai/ai-provider-settings-repository";
import { createDatabaseBackupAction, rebuildSearchIndexesAction, reseedDatabaseAction, resolveDuplicateExerciseAction, resolveDuplicateExercisesBulkAction, restoreDatabaseBackupAction, saveAiProviderSettingsAction, scanDuplicateExercisesAction } from "./actions";
import { getDuplicateComparisonRecords, listDuplicateReviewTasks } from "@/server/exercises/duplicate-review-service";
import { listAppUsers } from "@/server/auth/identity-service";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { IdentityLoginDialog } from "@/components/admin/identity-login-dialog";
import { createUserAction, loginAction, logoutAction, updateUserAction } from "./identity-actions";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  readonly searchParams: Promise<{
    readonly reseeded?: string;
    readonly reseedError?: string;
    readonly tab?: string;
    readonly backup?: string;
    readonly backupError?: string;
    readonly rebuild?: string;
    readonly rebuildError?: string;
    readonly restored?: string;
    readonly restoreError?: string;
    readonly aiSaved?: string;
    readonly aiError?: string;
    readonly loginError?: string;
    readonly loggedIn?: string;
    readonly loggedOut?: string;
    readonly userError?: string;
    readonly userSaved?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [searchStates, seedCompleteness, duplicateTasks, auditEvents, backups, appUsers, aiProviders] = await Promise.all([
    getSearchIndexStates(),
    getSeedCompletenessReport(),
    listDuplicateReviewTasks(),
    listRecentAuditEvents(),
    listDatabaseBackups(),
    listAppUsers(),
    listAiProviderSettings(),
  ]);
  const comparisonRecords = await getDuplicateComparisonRecords(duplicateTasks.flatMap((task) => [task.leftExerciseId, task.rightExerciseId]));
  const { reseeded, reseedError, tab, backup, backupError, rebuild, rebuildError, restored, restoreError, aiSaved, aiError, loginError, loggedIn, loggedOut, userError, userSaved } = await searchParams;
  const activeTab = normalizeAdminTab(tab);

  return (
    <AppShell
      title="Administration"
      subtitle="Systemstatus und schrittweise Administration von OCRCraft."
    >
      <div className="space-y-6">
        <AdminTabs active={activeTab} />
        {activeTab === "overview" ? <SeedCompletenessReportView report={seedCompleteness} /> : null}
        {activeTab === "quality" ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Datenqualität</div><h2 className="mt-1 text-xl font-black">Doppelungen prüfen</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Die Engine vergleicht normalisierte Namen, Aliase, Equipment, Körperregionen und externe IDs. Zusammenführen archiviert den überzähligen Datensatz und erhält die Trainingshistorie.</p></div>
            <form action={scanDuplicateExercisesAction}><ActionProgressButton className="min-h-11 rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" pendingLabel="Vergleiche Namen, Aliase und Zuordnungen …">Jetzt prüfen</ActionProgressButton></form>
          </div>
          {duplicateTasks.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">Keine offenen Doppelungsaufgaben.</p> : <DuplicateReviewPanel bulkAction={resolveDuplicateExercisesBulkAction} comparisonRecords={Object.fromEntries(comparisonRecords)} resolveAction={resolveDuplicateExerciseAction} tasks={duplicateTasks} />}
        </section> : null}
        {activeTab === "database" ? <section id="database-settings" className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Datenbank</div>
            <h2 className="mt-1 text-xl font-black">Initialdaten neu einspielen</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Stellt den vollständigen OCRCraft-Startzustand aus den versionierten Migrationen wieder her.
            </p>
          </div>

          {reseeded === "1" ? (
            <p aria-live="polite" className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
              Die Datenbank wurde mit den aktuellen Initialdaten neu aufgebaut.
            </p>
          ) : null}
          {backup ? <p aria-live="polite" className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">Backup erstellt: {backup}</p> : null}
          {backupError ? <p aria-live="assertive" className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">Das Datenbank-Backup konnte nicht erstellt werden.</p> : null}
          {restored ? <p aria-live="polite" className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">Backup wiederhergestellt: {restored}. Vorher wurde automatisch ein Sicherheitsbackup erstellt.</p> : null}
          {restoreError ? <p aria-live="assertive" className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">{restoreError === "confirmation" ? "Zur Wiederherstellung muss der Dateiname exakt bestätigt werden." : "Das Backup konnte nicht wiederhergestellt werden."}</p> : null}
          <form action={createDatabaseBackupAction} className="mt-4">
            <ActionProgressButton className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 text-sm font-black" pendingLabel="Backup wird erstellt …">Datenbank sichern</ActionProgressButton>
          </form>
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <h3 className="text-sm font-black">Portable Daten exportieren</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Exportiert nur die ausgewählten strukturierten Bereiche als versioniertes JSON. Binärmedien bleiben über Quellen- und Medienmetadaten referenziert.</p>
            <form action="/api/admin/export" className="mt-3 flex flex-wrap items-center gap-3" method="get" target="_blank">
              {[["exercises", "Übungen"], ["details", "Details"], ["mapping", "Mapping"], ["trainings", "Trainings"], ["groups", "Gruppen"], ["media", "Medien"], ["provenance", "Provenienz"]].map(([value, label]) => <label className="inline-flex items-center gap-2 text-xs font-bold" key={value}><input defaultChecked name="section" type="checkbox" value={value} />{label}</label>)}
              <button className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black" type="submit">JSON exportieren</button>
            </form>
          </div>
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <h3 className="text-sm font-black">Portable Daten importieren</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Nur versionierte `ocrcraft-portable`-JSON-Dateien importieren. Der Schreibvorgang ist auf Super-Admins begrenzt und läuft transaktional.</p>
            <form action="/api/admin/import" className="mt-3 flex flex-wrap items-center gap-3" encType="multipart/form-data" method="post" target="_blank">
              <input accept="application/json,.json" className="max-w-full text-xs" name="file" required type="file" />
              <button className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black" type="submit">JSON importieren</button>
            </form>
          </div>
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-black">Vorhandene Backups</h3><span className="text-xs font-bold text-[var(--muted)]">{backups.length} vorhanden</span></div>
            {backups.length === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">Noch kein Backup vorhanden.</p> : <ul className="mt-3 grid gap-2 text-xs text-[var(--muted)]">{backups.slice(0, 5).map((item) => <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2" key={item.fileName}><span><span className="font-bold text-[var(--foreground)]">{item.fileName}</span><span className="ml-2">{formatBytes(item.bytes)} · {item.createdAt}</span></span><form action={restoreDatabaseBackupAction} className="flex items-center gap-2"><input aria-label={`${item.fileName} bestätigen`} className="h-8 w-36 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-2 text-[10px]" name="confirmation" placeholder="Dateiname bestätigen" /><input name="fileName" type="hidden" value={item.fileName} /><button className="rounded-lg border border-[var(--danger)] px-2 py-1.5 text-[10px] font-black text-[var(--danger)]" type="submit">Wiederherstellen</button></form></li>)}</ul>}
          </div>
          {reseedError ? (
            <p aria-live="assertive" className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">
              {reseedError === "confirmation"
                ? "Die Bestätigungsphrase stimmt nicht. Es wurden keine Daten geändert."
                : "Die Datenbank konnte nicht neu aufgebaut werden. Die Transaktion wurde zurückgerollt."}
            </p>
          ) : null}

          <Disclosure className="group relative mt-4 max-w-md" summaryClassName="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[var(--danger)] px-4 py-2.5 text-sm font-black text-[var(--danger)] hover:bg-[var(--danger-bg)]" summary={
            <span aria-label="Datenbank-Reset bestätigen">Datenbank vollständig neu seed-en <span aria-hidden="true" className="transition-transform group-open:rotate-90">›</span></span>
          }>
            <div className="mt-2 rounded-2xl border border-[var(--danger)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-raised)] sm:absolute sm:right-0 sm:top-full sm:z-30 sm:w-[min(28rem,calc(100vw-2rem))]">
              <h3 className="font-black text-[var(--danger)]">Alle gespeicherten Daten werden gelöscht</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                Trainings, Gruppen, manuell angelegte Übungen und Änderungen an Initialübungen werden entfernt. Danach werden Schema und der vollständige zweisprachige Startkatalog frisch aufgebaut. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <form action={reseedDatabaseAction} className="mt-4 space-y-3">
                <label className="block text-sm font-bold" htmlFor="reseed-confirmation">
                  Tippe <span className="font-mono">OCRCRAFT ZURÜCKSETZEN</span> zur Bestätigung.
                </label>
                <input
                  autoComplete="off"
                  className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                  id="reseed-confirmation"
                  name="confirmation"
                  pattern="OCRCRAFT ZURÜCKSETZEN"
                  required
                  title="OCRCRAFT ZURÜCKSETZEN"
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <ActionProgressButton className="min-h-11 rounded-xl bg-[var(--danger)] px-4 text-sm font-black text-white" pendingLabel="Migrationen und Initialdaten werden aufgebaut …">Löschen und neu aufbauen</ActionProgressButton>
                </div>
              </form>
            </div>
          </Disclosure>
        </section> : null}

        {activeTab === "settings" ? (
          <>
            <section id="identity" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Identität und Betrieb</div><h2 className="mt-1 text-xl font-black">Benutzer und Rollen</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Super-Admins verwalten Vereinszugänge. Readonly-Trainingslinks bleiben ohne Anmeldung teilbar.</p></div>
                <div className="flex items-center gap-2"><IdentityLoginDialog action={loginAction} /><form action={logoutAction}><button className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-xs font-black" type="submit">Abmelden</button></form></div>
              </div>
              {loginError ? <p className="mt-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">Anmeldung fehlgeschlagen. Prüfe E-Mail und Vereinszugangscode.</p> : null}
              {loggedIn || loggedOut ? <p className="mt-4 rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">{loggedIn ? "Anmeldung erfolgreich." : "Abmeldung erfolgreich."}</p> : null}
              {userError ? <p className="mt-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">Benutzeränderung nicht möglich. Prüfe Berechtigung und Eingaben.</p> : null}
              {userSaved ? <p className="mt-4 rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">Benutzeränderung gespeichert.</p> : null}
              <form action={createUserAction} className="mt-5 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end">
                <label className="grid gap-1 text-xs font-black">Name<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" name="displayName" required /></label>
                <label className="grid gap-1 text-xs font-black">E-Mail<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" name="email" required type="email" /></label>
                <label className="grid gap-1 text-xs font-black">Passwort (min. 8)<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-normal" minLength={8} name="password" required type="password" /></label>
                <label className="grid gap-1 text-xs font-black">Rolle<select className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" defaultValue="trainer" name="role"><option value="trainer">Trainer</option><option value="admin">Admin</option><option value="super_admin">Super-Admin</option></select></label>
                <button className="min-h-10 rounded-lg bg-[var(--control-strong)] px-3 text-xs font-black text-[var(--control-strong-foreground)]" type="submit">Benutzer anlegen</button>
              </form>
              <div className="mt-4 grid gap-2">{appUsers.map((user) => <form action={updateUserAction} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end" encType="multipart/form-data" key={user.id}>
                <input name="id" type="hidden" value={user.id} />
                <label className="grid gap-1 text-xs font-black">Anzeigename<input className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-normal" defaultValue={user.displayName} name="displayName" required /></label>
                <label className="grid gap-1 text-xs font-black">Ausbildung<input className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-normal" defaultValue={user.education ?? ""} name="education" placeholder="z. B. DOSB C-Lizenz" /></label>
                <label className="grid gap-1 text-xs font-black">Rolle<select aria-label={`Rolle für ${user.displayName}`} className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs" defaultValue={user.role} name="role"><option value="trainer">Trainer</option><option value="admin">Admin</option><option value="super_admin">Super-Admin</option></select></label>
                <label className="inline-flex items-center gap-2 text-xs font-bold"><input defaultChecked={user.active} name="active" type="checkbox" />Aktiv</label>
                <label className="grid gap-1 text-xs font-black md:col-span-2">Schwerpunkte<input className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-normal" defaultValue={user.specialties ?? ""} name="specialties" placeholder="OCR, Kraft, Lauftechnik" /></label>
                <label className="grid gap-1 text-xs font-black md:col-span-2">Profilbild-URL<input className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-normal" defaultValue={user.profileImageUri ?? ""} name="profileImageUri" placeholder="/uploads/trainer.jpg oder https://…" /></label>
                <label className="grid gap-1 text-xs font-black md:col-span-2">Profilbild hochladen<input accept="image/jpeg,image/png,image/webp" className="min-h-9 max-w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-normal" name="profileImage" type="file" /><span className="font-normal text-[var(--muted)]">JPEG, PNG oder WebP · maximal 2 MB</span></label>
                <label className="grid gap-1 text-xs font-black md:col-span-3">Kurzprofil<textarea className="min-h-16 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-xs font-normal" defaultValue={user.bio ?? ""} name="bio" /></label>
                <button className="min-h-9 rounded-lg border border-[var(--border)] px-3 text-xs font-black" type="submit">Profil speichern</button>
              </form>)}</div>
            </section>
            <AiProviderSettingsPanel
              error={aiError}
              providers={aiProviders}
              saveAction={saveAiProviderSettingsAction}
              saved={aiSaved}
            />
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Einstellungen</div>
              <h2 className="mt-1 text-xl font-black">Darstellung und Diagnose</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Seitenspezifische Einstellungen bleiben hier gebündelt. Änderungen werden lokal für dieses Gerät gespeichert.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                  <h3 className="text-sm font-black">Darstellung</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Wähle zwischen hellem, dunklem und automatisch vom Betriebssystem übernommenem Theme.</p>
                  <div className="mt-3"><ThemeSwitcher /></div>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
                  <h3 className="text-sm font-black">Diagnose</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Optionale Diagnosewerkzeuge bleiben deaktiviert, solange sie nicht ausdrücklich benötigt werden.</p>
                  <div className="mt-3"><MuscleMapDebugSetting /></div>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "database" ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">DuckDB Search</div>
              <h2 className="mt-1 text-xl font-black">Suchindex-Status</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Änderungen an Übungen aktualisieren die Suchdokumente sofort und markieren den FTS-Index bewusst als dirty. Ein Rebuild wird erst als Admin-Aktion freigeschaltet, sobald RBAC vorhanden ist.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold">Read-only Admin</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {searchStates.map((state) => (
              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" key={state.locale}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black">{state.locale === "de" ? "Deutsch" : "English"}</div>
                  <StatusBadge status={state.status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-[var(--muted)]">Dokumente</dt><dd className="font-black">{state.indexedDocumentCount}</dd></div>
                  <div><dt className="text-[var(--muted)]">Letzter Rebuild</dt><dd className="font-semibold">{state.lastRebuiltAt ?? "noch nicht"}</dd></div>
                </dl>
                {state.lastError ? <p className="mt-3 text-sm font-semibold text-[var(--danger)]">{state.lastError}</p> : null}
              </article>
            ))}
          </div>
          {rebuild ? <p aria-live="polite" className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">Die deutschen und englischen Suchindizes wurden neu aufgebaut.</p> : null}
          {rebuildError ? <p aria-live="assertive" className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">Der Suchindex konnte nicht vollständig neu aufgebaut werden. Der betroffene Index bleibt als fehlerhaft markiert.</p> : null}
          <form action={rebuildSearchIndexesAction} className="mt-5">
            <ActionProgressButton className="min-h-11 rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]" pendingLabel="Deutscher und englischer Suchindex werden aufgebaut …">Beide Suchindizes aufbauen</ActionProgressButton>
          </form>
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <h3 className="text-sm font-black">Letzte Betriebsaktionen</h3>
            {auditEvents.length === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">Noch keine protokollierten Aktionen.</p> : <ul className="mt-3 grid gap-2 text-xs text-[var(--muted)]">{auditEvents.slice(0, 10).map((event) => <li className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2" key={event.id}><span className="font-black text-[var(--foreground)]">{event.action}</span> · {event.entityType} · {event.createdAt}</li>)}</ul>}
          </div>
        </section> : null}

        {activeTab === "overview" ? <section className="grid gap-4 md:grid-cols-3">
          <AdminArea title="Übungen" text="Create/Edit/Archive ist bereits in der Übungsbibliothek verfügbar." status="aktiv" />
          <AdminArea title="Suche" text="Status ist sichtbar. Rebuild/Search Profiles folgen nach RBAC." status="im Aufbau" />
          <AdminArea title="Benutzer & Rollen" text={`${appUsers.length} Benutzer persistiert. Schreibende globale Aktionen prüfen die Rolle serverseitig.`} status={appUsers.length ? "aktiv" : "bootstrap"} />
        </section> : null}
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { readonly status: string }) {
  const label = status === "healthy" ? "Aktuell" : status === "dirty" ? "Rebuild nötig" : status;
  return <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-black">{label}</span>;
}

function AdminArea({ title, text, status }: { readonly title: string; readonly text: string; readonly status: string }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3"><h2 className="font-black">{title}</h2><span className="text-xs font-bold text-[var(--muted)]">{status}</span></div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </article>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
