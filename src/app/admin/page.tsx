import { AppShell } from "@/components/app-shell";
import { getSearchIndexStates } from "@/server/search/search-index-service";
import { reseedDatabaseAction } from "./actions";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  readonly searchParams: Promise<{
    readonly reseeded?: string;
    readonly reseedError?: string;
  }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const searchStates = await getSearchIndexStates();
  const { reseeded, reseedError } = await searchParams;

  return (
    <AppShell
      title="Administration"
      subtitle="Systemstatus und schrittweise Administration von OCRCraft."
    >
      <div className="space-y-6">
        <section id="database-settings" className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Datenbank</div>
            <h2 className="mt-1 text-xl font-black">Initialdaten neu einspielen</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Stellt den vollständigen OCRCraft-Startzustand aus den versionierten Migrationen wieder her.
            </p>
          </div>

          {reseeded === "1" ? (
            <p aria-live="polite" className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
              Die Datenbank wurde mit den aktuellen Initialdaten neu aufgebaut.
            </p>
          ) : null}
          {reseedError ? (
            <p aria-live="assertive" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-900">
              {reseedError === "confirmation"
                ? "Die Bestätigungsphrase stimmt nicht. Es wurden keine Daten geändert."
                : "Die Datenbank konnte nicht neu aufgebaut werden. Die Transaktion wurde zurückgerollt."}
            </p>
          ) : null}

          <details className="group relative mt-4 max-w-md">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-black text-red-800 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">
              Datenbank vollständig neu seed-en
              <span aria-hidden="true" className="transition-transform group-open:rotate-90">›</span>
            </summary>
            <div className="mt-2 rounded-2xl border border-red-300 bg-white p-4 shadow-xl sm:absolute sm:right-0 sm:top-full sm:z-30 sm:w-[min(28rem,calc(100vw-2rem))]">
              <h3 className="font-black text-red-900">Alle gespeicherten Daten werden gelöscht</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                Trainings, Gruppen, manuell angelegte Übungen und Änderungen an Initialübungen werden entfernt. Danach werden Schema und der vollständige zweisprachige Startkatalog frisch aufgebaut. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <form action={reseedDatabaseAction} className="mt-4 space-y-3">
                <label className="block text-sm font-bold" htmlFor="reseed-confirmation">
                  Tippe <span className="font-mono">OCRCRAFT ZURÜCKSETZEN</span> zur Bestätigung.
                </label>
                <input
                  autoComplete="off"
                  className="min-h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm"
                  id="reseed-confirmation"
                  name="confirmation"
                  pattern="OCRCRAFT ZURÜCKSETZEN"
                  required
                  title="OCRCRAFT ZURÜCKSETZEN"
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <button className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-black text-white hover:bg-red-800" type="submit">
                    Löschen und neu aufbauen
                  </button>
                </div>
              </form>
            </div>
          </details>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">DuckDB Search</div>
              <h2 className="mt-1 text-xl font-black">Suchindex-Status</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Änderungen an Übungen aktualisieren die Suchdokumente sofort und markieren den FTS-Index bewusst als dirty. Ein Rebuild wird erst als Admin-Aktion freigeschaltet, sobald RBAC vorhanden ist.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-bold">Read-only Admin</span>
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
                {state.lastError ? <p className="mt-3 text-sm font-semibold text-[#b42318]">{state.lastError}</p> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <AdminArea title="Übungen" text="Create/Edit/Archive ist bereits in der Übungsbibliothek verfügbar." status="aktiv" />
          <AdminArea title="Suche" text="Status ist sichtbar. Rebuild/Search Profiles folgen nach RBAC." status="im Aufbau" />
          <AdminArea title="Benutzer & Rollen" text="Wird vor schreibenden globalen Admin-Aktionen umgesetzt." status="offen" />
        </section>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { readonly status: string }) {
  const label = status === "healthy" ? "Aktuell" : status === "dirty" ? "Rebuild nötig" : status;
  return <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black">{label}</span>;
}

function AdminArea({ title, text, status }: { readonly title: string; readonly text: string; readonly status: string }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="flex items-start justify-between gap-3"><h2 className="font-black">{title}</h2><span className="text-xs font-bold text-[var(--muted)]">{status}</span></div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </article>
  );
}
