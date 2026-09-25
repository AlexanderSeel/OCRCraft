import { AppShell } from "@/components/app-shell";
import { SeedCompletenessReportView } from "@/components/admin/seed-completeness-report";
import { CatalogCoverageReportView } from "@/components/admin/catalog-coverage-report";
import { QualityAnalyticsReportView } from "@/components/admin/quality-analytics-report";
import { MuscleMapDebugSetting } from "@/components/admin/muscle-map-debug-setting";
import { DuplicateReviewPanel } from "@/components/admin/duplicate-review-panel";
import { ActionProgressButton } from "@/components/admin/action-progress-button";
import { Disclosure } from "@/components/ui/disclosure";
import { ConfirmPopoverForm } from "@/components/ui/confirm-popover-form";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Card, CardHeader } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/form";
import { AdminTabs, normalizeAdminTab } from "@/components/admin/admin-tabs";
import { AiProviderSettingsPanel } from "@/components/admin/ai-provider-settings-panel";
import { SearchProfileSettingsPanel } from "@/components/admin/search-profile-settings-panel";
import { getSeedCompletenessReport } from "@/server/exercises/seed-completeness-service";
import { getCatalogCoverageReport } from "@/server/exercises/catalog-coverage-service";
import { getQualityAnalyticsReport } from "@/server/quality/quality-analytics-service";
import { getSearchIndexStates } from "@/server/search/search-index-service";
import { listSearchProfiles } from "@/server/search/search-profile-repository";
import { listRecentAuditEvents } from "@/server/db/audit-service";
import { listDatabaseBackups } from "@/server/db/backup-service";
import { listAiProviderSettings } from "@/server/ai/ai-provider-settings-repository";
import { activateSearchProfileAction, cancelAppTaskAction, createDatabaseBackupAction, deleteAiProviderSettingsAction, deleteAppTaskAction, deleteFailedMediaJobAction, deleteSearchProfileAction, disconnectAiProviderOAuthAction, rebuildSearchIndexesAction, reseedDatabaseAction, resolveDuplicateExerciseAction, resolveDuplicateExercisesBulkAction, restoreDatabaseBackupAction, retryAppTaskAction, saveAiProviderSettingsAction, saveSearchProfileAction, scanDuplicateExercisesAction } from "./actions";
import { getDuplicateComparisonRecords, listDuplicateReviewTasks } from "@/server/exercises/duplicate-review-service";
import { getClubAccessCode, listAppUsers } from "@/server/auth/identity-service";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { createUserAction, deleteUserAction, loginAction, logoutAction, saveClubAccessCodeAction, setUserPasswordAction, updateUserAction } from "./identity-actions";
import { IdentityManagementPanel } from "@/components/admin/identity-management-panel";
import { listAppTasks, listQueueIssues } from "@/server/queue/app-task-repository";
import { listAccessRoles, listUserRoleAssignments } from "@/server/auth/permission-service";
import { RolePermissionsPanel } from "@/components/admin/role-permissions-panel";
import { assignRoleAction, createRoleAction, deleteRoleAction, updateRoleAction } from "./role-actions";
import { getDictionaryCompletenessReport } from "@/i18n/dictionary-completeness";
import { TranslationCompletenessReport } from "@/components/admin/translation-completeness-report";
import { listExternalImportSources } from "@/server/exercises/import/external-import-source-repository";
import { saveExternalImportSourceAction, importExternalExercisesAction, previewExternalImportSourceAction, testExternalImportSourceAction } from "./actions";
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
    readonly searchSaved?: string;
    readonly searchError?: string;
    readonly queueDeleted?: string;
    readonly queued?: string;
    readonly roleSaved?: string;
    readonly roleError?: string;
    readonly importSaved?: string;
    readonly importError?: string;
    readonly imported?: string;
    readonly skipped?: string;
    readonly importTest?: string;
    readonly provider?: string;
    readonly sample?: string;
    readonly available?: string;
    readonly preview?: string;
    readonly languages?: string;
    readonly media?: string;
    readonly samples?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const activeTab = normalizeAdminTab(params.tab);
  const [searchStates, seedCompleteness, catalogCoverage, qualityAnalytics, duplicateTasks, auditEvents, backups, appUsers, aiProviders, appTasks, searchProfiles, queueIssues, accessRoles, roleAssignments, clubAccessCode, importSources, importCompleteness] = await Promise.all([
    activeTab === "database" ? getSearchIndexStates() : Promise.resolve([]),
    activeTab === "overview" ? getSeedCompletenessReport() : Promise.resolve(null),
    activeTab === "overview" ? getCatalogCoverageReport() : Promise.resolve(null),
    activeTab === "overview" ? getQualityAnalyticsReport() : Promise.resolve(null),
    activeTab === "quality" ? listDuplicateReviewTasks() : Promise.resolve([]),
    activeTab === "overview" ? listRecentAuditEvents() : Promise.resolve([]),
    activeTab === "database" ? listDatabaseBackups() : Promise.resolve([]),
    activeTab === "users" || activeTab === "roles" || activeTab === "overview" ? listAppUsers() : Promise.resolve([]),
    activeTab === "settings" ? listAiProviderSettings() : Promise.resolve([]),
    activeTab === "queue" ? listAppTasks() : Promise.resolve([]),
    activeTab === "settings" || activeTab === "overview" ? listSearchProfiles() : Promise.resolve([]),
    activeTab === "queue" ? listQueueIssues() : Promise.resolve([]),
    activeTab === "roles" ? listAccessRoles() : Promise.resolve([]),
    activeTab === "roles" ? listUserRoleAssignments() : Promise.resolve({}),
    activeTab === "users" ? getClubAccessCode() : Promise.resolve(null),
    activeTab === "imports" ? listExternalImportSources() : Promise.resolve([]),
    activeTab === "imports" ? getSeedCompletenessReport() : Promise.resolve(null),
  ]);
  const comparisonRecords = await getDuplicateComparisonRecords(duplicateTasks.flatMap((task) => [task.leftExerciseId, task.rightExerciseId]));
  const { reseeded, reseedError, backup, backupError, rebuild, rebuildError, restored, restoreError, aiSaved, aiError, loginError, loggedIn, loggedOut, userError, userSaved, searchSaved, searchError, queueDeleted, roleSaved, roleError } = params;

  return (
    <AppShell
      title="Administration"
      subtitle="Systemstatus und schrittweise Administration von OCRCraft."
    >
      <div className="admin-workspace space-y-4">
        <AdminTabs active={activeTab} />
        {queueDeleted === "1" ? <Alert tone="success">Der fehlgeschlagene Medienjob wurde gelöscht.</Alert> : null}
        {queueDeleted === "0" ? <Alert tone="danger">Der Fehler konnte nicht gelöscht werden. Der Eintrag ist möglicherweise bereits entfernt oder noch nicht fehlgeschlagen.</Alert> : null}
        {params.queued === "duplicate" ? <Alert tone="success">Die Dublettenentscheidung wurde in die Aufgabenqueue gestellt.</Alert> : null}
        {params.importSaved ? <Alert tone="success">Importquelle gespeichert.</Alert> : null}
        {params.imported ? <Alert tone="success">{params.imported} Übung(en) importiert, {params.skipped ?? "0"} bereits vorhanden oder übersprungen.</Alert> : null}
        {params.importTest === "ok" ? <Alert tone="success">Verbindung zu {params.provider === "exercisedb" ? "ExerciseDB" : "hasaneyldrm"} erfolgreich. Beispiel: {params.sample} · Datensätze verfügbar in der Testantwort: {params.available}.</Alert> : null}
        {params.importTest === "error" ? <Alert tone="danger">Die Verbindung zu {params.provider === "exercisedb" ? "ExerciseDB" : "hasaneyldrm"} konnte nicht geprüft werden.</Alert> : null}
        {params.preview ? <Alert tone="success">Vorschau: {params.available} Datensatz/Datensätze, Sprachen: {params.languages || "keine erkannt"}, Medienreferenzen: {params.media ?? "0"}. Beispiele: {params.samples || "keine"}</Alert> : null}
        {params.importError ? <Alert tone="danger">{params.importError === "url" ? "Die Quelladresse muss eine HTTPS-Adresse sein." : params.importError === "run" ? "Der Import konnte nicht ausgeführt werden. Prüfe Quelle, Zugriffsschlüssel und Serverprotokoll." : "Die Importquelle konnte nicht gespeichert werden."}</Alert> : null}
        {activeTab === "overview" && seedCompleteness ? <SeedCompletenessReportView report={seedCompleteness} /> : null}
        {activeTab === "overview" && catalogCoverage ? <CatalogCoverageReportView report={catalogCoverage} /> : null}
        {activeTab === "overview" && qualityAnalytics ? <QualityAnalyticsReportView report={qualityAnalytics} /> : null}
        {activeTab === "quality" ? <section className="admin-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Datenqualität</div><h2 className="mt-1 text-xl font-black">Doppelungen prüfen</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Die Engine vergleicht normalisierte Namen, Aliase, Equipment, Körperregionen und externe IDs. Zusammenführen archiviert den überzähligen Datensatz und erhält die Trainingshistorie.</p></div>
            <form action={scanDuplicateExercisesAction}><ActionProgressButton className={buttonClass("primary", "px-4")} pendingLabel="Vergleiche Namen, Aliase und Zuordnungen …">Jetzt prüfen</ActionProgressButton></form>
          </div>
          {duplicateTasks.length === 0 ? <EmptyState title="Keine offenen Doppelungsaufgaben">Die Qualitätsprüfung ist aktuell ohne offene Treffer.</EmptyState> : <DuplicateReviewPanel bulkAction={resolveDuplicateExercisesBulkAction} comparisonRecords={Object.fromEntries(comparisonRecords)} resolveAction={resolveDuplicateExerciseAction} tasks={duplicateTasks} />}
          <TranslationCompletenessReport report={getDictionaryCompletenessReport()} />
        </section> : null}
        {activeTab === "queue" ? <section className="admin-panel">
          <div><div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Betrieb</div><h2 className="mt-1 text-xl font-black">Hintergrundaufgaben</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Laufende Prüfungen und Wartungsaktionen blockieren die Oberfläche nicht. Fehlgeschlagene Aufgaben können erneut gestartet oder abgeschlossene Einträge gelöscht werden.</p></div>
          <div className="mt-5 grid gap-3">{appTasks.length === 0 && queueIssues.length === 0 ? <EmptyState title="Noch keine Aufgaben vorhanden">Laufende und abgeschlossene Hintergrundaufgaben werden hier angezeigt.</EmptyState> : <>{appTasks.map((task) => <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" key={task.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{task.title}</h3><p className="mt-1 text-xs text-[var(--muted)]">{task.status} · {task.createdAt}</p></div><span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-black">{task.progress}%</span></div>{task.progressMessage ? <p className="mt-2 text-sm text-[var(--muted)]">{task.progressMessage}</p> : null}{task.errorMessage ? <p className="mt-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] p-2 text-xs text-[var(--danger)]">{task.errorMessage}</p> : null}<div className="mt-3 flex flex-wrap gap-2">{task.status === "running" || task.status === "queued" ? <form action={cancelAppTaskAction}><input name="id" type="hidden" value={task.id} /><button className="rounded-lg border border-[var(--danger)] px-3 py-1.5 text-xs font-black text-[var(--danger)]">Abbrechen</button></form> : null}{task.status === "failed" || task.status === "cancelled" ? <form action={retryAppTaskAction}><input name="id" type="hidden" value={task.id} /><button className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-black">Erneut starten</button></form> : null}{task.status === "succeeded" || task.status === "failed" || task.status === "cancelled" ? <form action={deleteAppTaskAction}><input name="id" type="hidden" value={task.id} /><button className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-black">Löschen</button></form> : null}</div></article>)}{queueIssues.filter((issue) => issue.source === "media").map((issue) => <article className="rounded-xl border border-[var(--danger)] bg-[var(--surface-subtle)] p-4" key={`media-${issue.id}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{issue.title}</h3><p className="mt-1 text-xs text-[var(--muted)]">KI-Bildjob · {issue.status} · {issue.createdAt}</p></div><span className="text-xs font-black">{issue.progress}%</span></div>{issue.message ? <p className="mt-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] p-2 text-xs text-[var(--danger)]">{issue.message}</p> : null}{issue.status === "media:failed" ? <form action={deleteFailedMediaJobAction} className="mt-3"><input name="id" type="hidden" value={issue.id} /><button className="rounded-lg border border-[var(--danger)] px-3 py-1.5 text-xs font-black text-[var(--danger)]">Fehler löschen</button></form> : null}</article>)}</>}</div>
        </section> : null}
        {activeTab === "imports" ? <ExternalImportPanel completeness={importCompleteness} sources={importSources} /> : null}
        {activeTab === "database" ? <section id="database-settings" className="admin-panel scroll-mt-24">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Datenbank</div>
            <h2 className="mt-1 text-xl font-black">Initialdaten neu einspielen</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Stellt den vollständigen OCRCraft-Startzustand aus den versionierten Migrationen wieder her.
            </p>
          </div>

          {reseeded === "1" ? (
            <Alert tone="success">
              Die Datenbank wurde mit den aktuellen Initialdaten neu aufgebaut.
            </Alert>
          ) : null}
          {backup ? <Alert tone="success">Backup erstellt: {backup}</Alert> : null}
          {backupError ? <Alert tone="danger">Das Datenbank-Backup konnte nicht erstellt werden.</Alert> : null}
          {restored ? <Alert tone="success">Backup wiederhergestellt: {restored}. Vorher wurde automatisch ein Sicherheitsbackup erstellt.</Alert> : null}
          {restoreError ? <Alert tone="danger">{restoreError === "confirmation" ? "Zur Wiederherstellung muss der Dateiname exakt bestätigt werden." : "Das Backup konnte nicht wiederhergestellt werden."}</Alert> : null}
          <form action={createDatabaseBackupAction} className="mt-4">
            <ActionProgressButton className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 text-sm font-black" pendingLabel="Backup wird erstellt …">Datenbank sichern</ActionProgressButton>
          </form>
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <h3 className="text-sm font-black">Portable Daten exportieren</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Exportiert nur die ausgewählten strukturierten Bereiche als versioniertes JSON. Binärmedien bleiben standardmäßig über Quellen- und Medienmetadaten referenziert.</p>
            <form action="/api/admin/export" className="mt-3 flex flex-wrap items-center gap-3" method="get" target="_blank">
              {[["exercises", "Übungen"], ["details", "Details"], ["mapping", "Mapping"], ["trainings", "Trainings"], ["groups", "Gruppen"], ["media", "Medien"], ["provenance", "Provenienz"]].map(([value, label]) => <label className="inline-flex items-center gap-2 text-xs font-bold" key={value}><input defaultChecked name="section" type="checkbox" value={value} />{label}</label>)}
              <label className="inline-flex items-center gap-2 text-xs font-bold"><input name="includeBinary" type="checkbox" value="1" />Binärmedien einbetten (größerer Export)</label>
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
            {backups.length === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">Noch kein Backup vorhanden.</p> : <ul className="mt-3 grid gap-2 text-xs text-[var(--muted)]">{backups.slice(0, 5).map((item) => <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2" key={item.fileName}><span><span className="font-bold text-[var(--foreground)]">{item.fileName}</span><span className="ml-2">{formatBytes(item.bytes)} · {item.createdAt}</span></span><ConfirmPopoverForm action={restoreDatabaseBackupAction} description="Das aktuelle Datenbankmodell wird durch den gewählten Backupstand ersetzt. Vorher wird ein Sicherheitsbackup angelegt." title="Backup wiederherstellen?" triggerLabel="Wiederherstellen"><input aria-label={`${item.fileName} bestätigen`} className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-2 text-[10px]" name="confirmation" placeholder="Dateiname bestätigen" required /><input name="fileName" type="hidden" value={item.fileName} /></ConfirmPopoverForm></li>)}</ul>}
          </div>
          {reseedError ? (
            <Alert tone="danger">
              {reseedError === "confirmation"
                ? "Die Bestätigungsphrase stimmt nicht. Es wurden keine Daten geändert."
                : "Die Datenbank konnte nicht neu aufgebaut werden. Die Transaktion wurde zurückgerollt."}
            </Alert>
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

        {activeTab === "users" ? (
          <>
            {loginError ? <Alert tone="danger">Anmeldung fehlgeschlagen. Prüfe E-Mail und Vereinszugangscode.</Alert> : null}
            {loggedIn || loggedOut ? <Alert tone="success">{loggedIn ? "Anmeldung erfolgreich." : "Abmeldung erfolgreich."}</Alert> : null}
            {userError ? <Alert tone="danger">{userError === "permission" ? "Keine Berechtigung. Benutzer, Rollen und Passwörter dürfen nur Super-Admins ändern." : userError === "delete" ? "Benutzer konnte nicht gelöscht werden. Prüfe Verknüpfungen und Berechtigung." : "Benutzeränderung nicht möglich. Prüfe Eingaben."}</Alert> : null}
            {userSaved ? <Alert tone="success">{userSaved === "password" ? "Passwort wurde gesetzt." : userSaved === "deleted" ? "Benutzer wurde gelöscht." : "Benutzeränderung gespeichert."}</Alert> : null}
            {userError === "access-code" ? <Alert tone="danger">Der Vereinscode konnte nicht gespeichert werden.</Alert> : null}
            <IdentityManagementPanel
              createAction={createUserAction}
              deleteAction={deleteUserAction}
              loginAction={loginAction}
              logoutAction={logoutAction}
              setPasswordAction={setUserPasswordAction}
              updateAction={updateUserAction}
              saveAccessCodeAction={saveClubAccessCodeAction}
              accessCodeConfigured={Boolean(clubAccessCode)}
              users={appUsers}
            />
          </>
        ) : null}

        {activeTab === "roles" ? (
          <>
            {roleError ? <Alert tone="danger">Rollenänderung nicht möglich. Prüfe Berechtigung und Eingaben.</Alert> : null}
            {roleSaved ? <Alert tone="success">{roleSaved === "deleted" ? "Rolle wurde gelöscht." : roleSaved === "assigned" ? "Rollenzuweisung gespeichert." : "Rolle wurde gespeichert."}</Alert> : null}
            <RolePermissionsPanel assignAction={assignRoleAction} assignments={roleAssignments} createAction={createRoleAction} deleteAction={deleteRoleAction} roles={accessRoles} updateAction={updateRoleAction} users={appUsers} />
          </>
        ) : null}

        {activeTab === "settings" ? (
          <>
            <AiProviderSettingsPanel
              deleteAction={deleteAiProviderSettingsAction}
              disconnectOAuthAction={disconnectAiProviderOAuthAction}
              error={aiError}
              providers={aiProviders}
              saveAction={saveAiProviderSettingsAction}
              saved={aiSaved}
            />
            <SearchProfileSettingsPanel
              activateAction={activateSearchProfileAction}
              deleteAction={deleteSearchProfileAction}
              error={searchError}
              profiles={searchProfiles}
              saveAction={saveSearchProfileAction}
              saved={searchSaved}
            />
            <section className="admin-panel">
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

        {activeTab === "database" ? <section className="admin-panel">
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
            <ActionProgressButton className={buttonClass("primary", "px-4")} pendingLabel="Deutscher und englischer Suchindex werden aufgebaut …">Beide Suchindizes aufbauen</ActionProgressButton>
          </form>
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <h3 className="text-sm font-black">Letzte Betriebsaktionen</h3>
            {auditEvents.length === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">Noch keine protokollierten Aktionen.</p> : <ul className="mt-3 grid gap-2 text-xs text-[var(--muted)]">{auditEvents.slice(0, 10).map((event) => <li className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2" key={event.id}><span className="font-black text-[var(--foreground)]">{event.action}</span> · {event.entityType} · {event.createdAt}</li>)}</ul>}
          </div>
        </section> : null}

        {activeTab === "overview" ? <section className="grid gap-4 md:grid-cols-3">
          <AdminArea title="Übungen" text="Create/Edit/Archive ist bereits in der Übungsbibliothek verfügbar." status="aktiv" />
          <AdminArea title="Suche" text={`${searchProfiles.length} Suchprofile verfügbar; ${searchProfiles.find((profile) => profile.isActive)?.name ?? "Ausgewogen"} steuert aktuell die Ranking-Gewichte.`} status="aktiv" />
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

function ExternalImportPanel({ sources, completeness }: { readonly sources: readonly { provider: "exercisedb" | "hasaneyldrm"; baseUrl: string; enabled: boolean; hasApiKey: boolean; lastImportAt: string | null; lastImportResult: string | null; keyStorageAvailable: boolean }[]; readonly completeness: Awaited<ReturnType<typeof getSeedCompletenessReport>> | null }) {
  const source = (provider: "exercisedb" | "hasaneyldrm") => sources.find((item) => item.provider === provider);
  return <section className="admin-panel" id="external-imports">
    <div className="max-w-4xl">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Datenimport</div>
      <h2 className="mt-1 text-xl font-black">ExerciseDB und hasaneyldrm</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Importiert strukturierte Übungsdaten serverseitig. ExerciseDB wird über AscendAPI/RapidAPI mit Zugriffsschlüssel angesprochen; hasaneyldrm wird als versionierter GitHub-JSON-Datensatz geladen. Importierte Datensätze bleiben zunächst prüfpflichtige externe Katalogeinträge.
      </p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
        Fehlende deutsche Texte werden im Import als Übersetzung erforderlich markiert und dürfen erst nach Trainerprüfung veröffentlicht werden. Für die dauerhafte Schlüsselablage muss <code>OCRCRAFT_AI_SECRET_KEY</code> gesetzt sein.
      </p>
    </div>
    <div className="mt-5 grid gap-4 xl:grid-cols-2">
      {(["exercisedb", "hasaneyldrm"] as const).map((provider) => {
        const item = source(provider);
        return <Card className="p-4" key={provider}>
          <CardHeader title={provider === "exercisedb" ? "ExerciseDB / AscendAPI" : "hasaneyldrm GitHub-Dataset"}>
            <span className="text-xs font-bold text-[var(--muted)]">{item?.hasApiKey ? "Schlüssel gespeichert" : provider === "exercisedb" ? "Schlüssel fehlt" : "kein Schlüssel erforderlich"}</span>
          </CardHeader>
          <form action={saveExternalImportSourceAction} className="mt-4 grid gap-3">
            <input name="provider" type="hidden" value={provider} />
            <label className="grid gap-1 text-sm font-bold">Quelladresse<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={item?.baseUrl} name="baseUrl" required /></label>
            <label className="grid gap-1 text-sm font-bold">{provider === "exercisedb" ? "RapidAPI-Schlüssel" : "Optionaler Zugriffsschlüssel"}<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" name="apiKey" placeholder={item?.hasApiKey ? "leer lassen, um den Schlüssel zu behalten" : "Zugriffsschlüssel"} type="password" /></label>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold"><label className="inline-flex items-center gap-2"><input defaultChecked={item?.enabled ?? true} name="enabled" type="checkbox" value="1" />Quelle aktiv</label>{item?.hasApiKey ? <label className="inline-flex items-center gap-2"><input name="clearApiKey" type="checkbox" value="1" />Schlüssel löschen</label> : null}</div>
            <button className="min-h-10 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" type="submit">Quelle speichern</button>
          </form>
          <form action={testExternalImportSourceAction} className="mt-2">
            <input name="provider" type="hidden" value={provider} />
            <button className="min-h-10 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" type="submit">Verbindung testen</button>
          </form>
          <form action={importExternalExercisesAction} className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <input name="provider" type="hidden" value={provider} />
            <label className="grid gap-1 text-xs font-bold">Maximale Datensätze<input className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm" defaultValue="25" max="200" min="1" name="limit" type="number" /></label>
            <label className="inline-flex items-center gap-2 text-xs font-bold sm:col-span-2"><input name="autoTranslate" type="checkbox" value="1" />Fehlende deutsche Texte automatisch übersetzen</label>
            <div className="flex flex-wrap gap-2 sm:col-span-2"><button className="min-h-10 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" formAction={previewExternalImportSourceAction} type="submit">Vorschau laden</button><button className="min-h-10 rounded-lg bg-[var(--control-strong)] px-3 py-2 text-xs font-black text-[var(--control-strong-foreground)]" type="submit">Import starten</button></div>
          </form>
          <p className="mt-3 text-xs text-[var(--muted)]">{item?.lastImportAt ? `Letzter Import: ${item.lastImportAt} · ${item.lastImportResult ?? "ohne Ergebnis"}` : "Noch kein Import ausgeführt."}</p>
        </Card>;
      })}
    </div>
    {completeness ? <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-black">Import-Coverage und Reviewstatus</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Der Katalog-Audit prüft auch importierte Übungen auf zweisprachige Pflichtfelder, Ausführung, Coaching, Körperregionen, Equipment und strukturierte Basisdaten.</p></div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-black">{completeness.completeCatalogExercises} / {completeness.totalCatalogExercises} vollständig</span>
      </div>
      {completeness.incompleteCatalogExercises.length ? <div className="mt-3 grid gap-2 text-xs">{completeness.incompleteCatalogExercises.slice(0, 12).map((row) => <div className="flex flex-wrap justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2" key={row.exerciseId}><span className="font-black">{row.nameDe || row.nameEn}</span><span className="text-[var(--muted)]">{row.missingFields.join(", ")}</span></div>)}</div> : <p className="mt-3 text-xs font-bold text-[var(--success-foreground)]">Keine offenen Pflichtfeldlücken im vollständigen Katalog.</p>}
    </div> : null}
  </section>;
}

function AdminArea({ title, text, status }: { readonly title: string; readonly text: string; readonly status: string }) {
  return (
    <Card className="p-5">
      <CardHeader title={title}><span className="text-xs font-bold text-[var(--muted)]">{status}</span></CardHeader>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
