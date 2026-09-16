import { AppShell } from "@/components/app-shell";
import { getSearchIndexStates } from "@/server/search/search-index-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const searchStates = await getSearchIndexStates();

  return (
    <AppShell
      title="Administration"
      subtitle="Systemstatus und schrittweise Administration von OCRCraft."
    >
      <div className="space-y-6">
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
