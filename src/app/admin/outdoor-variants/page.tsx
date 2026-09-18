import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OverviewLayout } from "@/components/overview-layout";
import { FilterSidePanel } from "@/components/layout/filter-side-panel";
import { CatalogResultCount } from "@/components/catalog/catalog-controls";
import {
  listOutdoorVariantCandidates,
  type OutdoorVariantCandidatePreview,
} from "@/server/exercises/outdoor-variant-enrichment-service";
import {
  approveOutdoorVariantCandidateAction,
  runOutdoorVariantEnrichmentAction,
} from "../actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    scanned?: string;
    enriched?: string;
    existing?: string;
    unmappable?: string;
    missingDetails?: string;
    candidate?: string;
    error?: string;
    q?: string;
    status?: string;
  }>;
}

export default async function OutdoorVariantAdminPage({ searchParams }: PageProps) {
  const [result, candidates] = await Promise.all([
    searchParams,
    listOutdoorVariantCandidates(),
  ]);
  const hasResult = result.scanned != null;
  const searchQuery = result.q?.trim().toLocaleLowerCase("de-DE") ?? "";
  const statusFilter = ["ready", "existing", "review"].includes(result.status ?? "") ? result.status : "";
  const filteredCandidates = candidates.filter((candidate) => {
    if (searchQuery && !candidate.name.toLocaleLowerCase("de-DE").includes(searchQuery)) return false;
    if (statusFilter === "review") return candidate.status === "unmappable" || candidate.status === "missing-details";
    return !statusFilter || candidate.status === statusFilter;
  });
  const ready = candidates.filter((candidate) => candidate.status === "ready");
  const existing = candidates.filter((candidate) => candidate.status === "existing");
  const needsReview = candidates.filter((candidate) => candidate.status === "unmappable" || candidate.status === "missing-details");
  const candidateFeedback = outdoorCandidateFeedback(result.candidate);

  return (
    <AppShell
      title="Outdoor-Varianten prüfen"
      subtitle="Prüft importierte Fitnessstudio-Übungen auf portable Outdoor-Alternativen und hinterlegt strukturierte Ersatz-Equipment-Varianten."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/admin">
            Administration
          </Link>
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/exercises">
            Übungen
          </Link>
        </div>
      )}
    >
      <OverviewLayout storageKey="ocrcraft-outdoor-view"><div className="space-y-6">
        {result.error ? (
          <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]">
            Der Outdoor-Varianten-Task konnte nicht abgeschlossen werden. Es wurden keine unvollständigen Varianten übernommen.
          </div>
        ) : null}

        {candidateFeedback ? (
          <div className={`rounded-xl border p-4 text-sm font-bold ${candidateFeedback.success ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-foreground)]" : "border-[var(--warning)] bg-[var(--warning-bg)]"}`}>
            {candidateFeedback.message}
          </div>
        ) : null}

        {hasResult ? (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">Letzter Lauf</div>
            <div aria-label="Ergebnis-Metadaten" className="mt-4 flex flex-wrap gap-2">
              <MetaTag label="Geprüft" value={result.scanned ?? "0"} />
              <MetaTag label="Neu ergänzt" value={result.enriched ?? "0"} />
              <MetaTag label="Schon vorhanden" value={result.existing ?? "0"} />
              <MetaTag label="Nicht abbildbar" value={result.unmappable ?? "0"} />
              <MetaTag label="Details fehlen" value={result.missingDetails ?? "0"} />
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">Datenqualität · Import</div>
              <h2 className="mt-1 text-xl font-black">Gym-Übungen für Outdoor-Training anreichern</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Der Task betrachtet nur importierte bzw. aus Datensätzen stammende aktive Übungen. Portable Geräte bleiben erhalten. Studio-gebundene Geräte wie Cable, Machine, Dumbbell, Barbell oder Bench werden nur dann ersetzt, wenn OCRCraft eine bekannte portable Alternative im Equipment-Katalog besitzt.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <MetaTag label="Übernahmebereit" value={String(ready.length)} />
              <MetaTag label="Vorhanden" value={String(existing.length)} />
              <MetaTag label="Manuell prüfen" value={String(needsReview.length)} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <Info title="1. Prüfen" text="Ermittelt Studio-Abhängigkeiten anhand der strukturierten Equipment-Zuordnung – nicht anhand des Übungsnamens." />
            <Info title="2. Ersetzen" text="Verwendet konservative Zuordnungen wie Cable → Resistance Band, Bench → Box und Barbell/Dumbbell → Sandbag/Kettlebell/Band, sofern vorhanden." />
            <Info title="3. Planbar machen" text="Speichert eigene Outdoor-Equipment-Anforderungen und eine DE/EN-Variantenbeschreibung. Der Outdoor-Training-Builder verwendet danach diese Ersatzgeräte." />
          </div>

          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--muted)]">
            Eine Übung wird nur als outdoor-geeignet markiert, wenn alle erkannten Studio-Abhängigkeiten vollständig ersetzt werden können. Nicht abbildbare Übungen bleiben unverändert und müssen später manuell geprüft werden. Du kannst Varianten einzeln prüfen und übernehmen oder alle aktuell sicheren Vorschläge gesammelt anwenden.
          </div>

          <form action={runOutdoorVariantEnrichmentAction} className="mt-5 flex justify-end">
            <button className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">
              {ready.length > 0 ? `${ready.length} sichere Outdoor-Varianten gesammelt übernehmen` : "Importierte Übungen erneut prüfen"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">Review</div>
              <h2 className="mt-1 text-xl font-black">Erkannte Gym-Abhängigkeiten</h2>
            </div>
            <span className="text-sm font-bold text-[var(--muted)]">{candidates.length} betroffene Übungen</span>
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-[max-content_minmax(0,1fr)] lg:items-start">
          <FilterSidePanel title="Outdoor-Filter">
            <form className="grid min-w-0 gap-3" method="get">
              <label className="grid gap-1 text-sm font-bold">
                Suchen
                <input className="h-11 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={result.q ?? ""} name="q" placeholder="z. B. Cable, Bench ..." />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Status
                <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={statusFilter} name="status">
                  <option value="">Alle</option>
                  <option value="ready">Bereit</option>
                  <option value="existing">Bereits vorhanden</option>
                  <option value="review">Manuell prüfen</option>
                </select>
              </label>
              <button className="min-h-11 rounded-xl bg-[var(--control-strong)] px-4 py-3 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">Filtern</button>
              {(searchQuery || statusFilter) ? <Link className="text-center text-xs font-black underline underline-offset-4" href="/admin/outdoor-variants">Filter zurücksetzen</Link> : null}
            </form>
          </FilterSidePanel>
          <div className="min-w-0">
          <div className="mb-4 text-sm text-[var(--muted)]"><CatalogResultCount from={filteredCandidates.length ? 1 : 0} label={filteredCandidates.length === 1 ? "Übung" : "Übungen"} to={filteredCandidates.length} total={filteredCandidates.length} /></div>
          {filteredCandidates.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">
              Keine importierte aktive Übung mit erkannter Studio-Equipment-Abhängigkeit gefunden.
            </div>
          ) : (
            <div className="catalog-results mt-5 space-y-3">
              {filteredCandidates.map((candidate) => <CandidateCard candidate={candidate} key={candidate.exerciseId} />)}
            </div>
          )}
          </div>
          </div>
        </section>
      </div></OverviewLayout>
    </AppShell>
  );
}

function CandidateCard({ candidate }: { readonly candidate: OutdoorVariantCandidatePreview }) {
  return (
    <article className="catalog-card min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-black">{candidate.name}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link className="inline-flex min-h-9 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black hover:bg-[var(--surface-elevated)]" href={`/exercises/${candidate.exerciseId}/edit`}>
              Übung öffnen
            </Link>
            {candidate.status === "ready" ? (
              <form action={approveOutdoorVariantCandidateAction}>
                <input name="exerciseId" type="hidden" value={candidate.exerciseId} />
                <button className="min-h-9 rounded-lg bg-[var(--control-strong)] px-3 text-xs font-black text-[var(--control-strong-foreground)]" type="submit">
                  Diese Variante übernehmen
                </button>
              </form>
            ) : null}
          </div>
        </div>
        <StatusBadge status={candidate.status} />
      </div>

      <div className="view-secondary mt-4 grid gap-4 lg:grid-cols-3">
        <DataBlock title="Original-Equipment" values={candidate.originalEquipment} empty="Kein Equipment hinterlegt" />
        <DataBlock title="Erkannte Ersetzungen" values={candidate.substitutions} empty="Keine automatische Ersetzung" />
        <DataBlock title="Outdoor-Equipment" values={candidate.outdoorEquipment} empty="Noch nicht vollständig abbildbar" />
      </div>

      {candidate.missingReplacements.length > 0 ? (
        <div className="view-secondary mt-4 rounded-lg border border-[var(--warning)] bg-[var(--warning-bg)] p-3 text-sm">
          <span className="font-black">Fehlende Ersatzabbildung:</span> {candidate.missingReplacements.join(", ")}
        </div>
      ) : null}

      {candidate.variantText ? (
        <div className="view-detail mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm leading-6">
          <div className="mb-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">Varianten-Vorschau</div>
          {candidate.variantText}
        </div>
      ) : null}

      {candidate.status === "unmappable" || candidate.status === "missing-details" ? (
        <p className="view-secondary mt-3 text-xs leading-5 text-[var(--muted)]">
          Keine automatische Übernahme. Öffne die Übung und hinterlege die Outdoor-Variante sowie das tatsächlich verfügbare Ersatz-Equipment manuell.
        </p>
      ) : null}
    </article>
  );
}

function outdoorCandidateFeedback(status?: string): { readonly success: boolean; readonly message: string } | null {
  if (!status) return null;
  if (status === "enriched") return { success: true, message: "Outdoor-Variante wurde strukturiert übernommen und steht dem Outdoor-Training-Builder zur Verfügung." };
  if (status === "existing") return { success: true, message: "Eine bestehende Outdoor-Variante wurde beibehalten und nicht überschrieben." };
  if (status === "unmappable") return { success: false, message: "Diese Übung lässt sich mit den bekannten Ersatzgeräten nicht vollständig automatisch abbilden. Bitte manuell prüfen." };
  if (status === "missing-details") return { success: false, message: "Für diese Übung fehlen strukturierte Übungsdetails. Ergänze diese zuerst im Übungseditor." };
  if (status === "not-found") return { success: false, message: "Die ausgewählte Übung ist nicht mehr als übernahmebereiter Import-Kandidat verfügbar." };
  return { success: false, message: "Die Outdoor-Variante konnte nicht übernommen werden." };
}

function DataBlock({ title, values, empty }: { readonly title: string; readonly values: readonly string[]; readonly empty: string }) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">{title}</div>
      {values.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm font-semibold">
          {values.map((value) => <li key={value}>• {value}</li>)}
        </ul>
      ) : <p className="mt-2 text-sm text-[var(--muted)]">{empty}</p>}
    </div>
  );
}

function StatusBadge({ status }: { readonly status: OutdoorVariantCandidatePreview["status"] }) {
  const labels: Record<OutdoorVariantCandidatePreview["status"], string> = {
    ready: "Bereit",
    existing: "Bereits vorhanden",
    unmappable: "Manuell prüfen",
    "missing-details": "Übungsdetails fehlen",
  };
  return <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black">{labels[status]}</span>;
}

function MetaTag({ label, value }: { readonly label: string; readonly value: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-bold"><span className="text-[var(--muted)]">{label}:</span><span>{value}</span></span>;
}

function Info({ title, text }: { readonly title: string; readonly text: string }) {
  return <article className="rounded-xl border border-[var(--border)] p-4"><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p></article>;
}
