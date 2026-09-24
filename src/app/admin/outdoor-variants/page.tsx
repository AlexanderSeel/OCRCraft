import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OverviewLayout } from "@/components/overview-layout";
import { CatalogFilterPanel, CatalogPageSize } from "@/components/catalog/catalog-filter-panel";
import { CatalogPagination, CatalogResultCount } from "@/components/catalog/catalog-controls";
import {
  getPortabilityAuditOverview,
  listOutdoorVariantCandidates,
  type OutdoorVariantCandidatePreview,
  type PortabilityAuditEntry,
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
    manualReview?: string;
    candidate?: string;
    error?: string;
    q?: string;
    status?: string;
    page?: string;
    size?: string;
  }>;
}

export default async function OutdoorVariantAdminPage({ searchParams }: PageProps) {
  const [result, candidates, portabilityAudit] = await Promise.all([
    searchParams,
    listOutdoorVariantCandidates(),
    getPortabilityAuditOverview(),
  ]);
  const hasResult = result.scanned != null;
  const searchQuery = result.q?.trim().toLocaleLowerCase("de-DE") ?? "";
  const statusFilter = ["ready", "existing", "review-required", "review"].includes(result.status ?? "") ? result.status : "";
  const filteredCandidates = candidates.filter((candidate) => {
    if (searchQuery && !candidate.name.toLocaleLowerCase("de-DE").includes(searchQuery)) return false;
    if (statusFilter === "review") return candidate.status === "review-required" || candidate.status === "unmappable" || candidate.status === "missing-details";
    return !statusFilter || candidate.status === statusFilter;
  });
  const requestedSize = Number(result.size ?? "12");
  const pageSize = [6, 12, 24].includes(requestedSize) ? requestedSize : 12;
  const page = Math.max(1, Number(result.page ?? "1") || 1);
  const visibleCandidates = filteredCandidates.slice((page - 1) * pageSize, page * pageSize);
  const ready = candidates.filter((candidate) => candidate.status === "ready");
  const existing = candidates.filter((candidate) => candidate.status === "existing");
  const needsReview = candidates.filter((candidate) => candidate.status === "review-required" || candidate.status === "unmappable" || candidate.status === "missing-details");
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
              <MetaTag label="Fachreview offen" value={result.manualReview ?? "0"} />
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">Qualitätsworkflow</div>
              <h2 className="mt-1 text-xl font-black">Portabilitäts-Audit</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Zeigt die persistierte Portabilitätsentscheidung mit Herkunft, Begründung, Ersatz-Equipment und Reviewstatus. Offene Reviews stehen zuerst.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <MetaTag label="Gesamt" value={String(portabilityAudit.summary.total)} />
              <MetaTag label="Portabel" value={String(portabilityAudit.summary.portable)} />
              <MetaTag label="Konvertiert" value={String(portabilityAudit.summary.converted)} />
              <MetaTag label="Blockiert" value={String(portabilityAudit.summary.blocked)} />
              <MetaTag label="Review offen" value={String(portabilityAudit.summary.pending)} />
            </div>
          </div>
          {portabilityAudit.summary.latestReviewAt ? (
            <p className="mt-3 text-xs font-bold text-[var(--muted)]">
              Letzte Audit-Aktualisierung: {formatAuditTime(portabilityAudit.summary.latestReviewAt)}
            </p>
          ) : null}
          <div className="mt-4 grid gap-2">
            {portabilityAudit.entries.length > 0 ? portabilityAudit.entries.map((entry) => (
              <PortabilityAuditRow entry={entry} key={entry.exerciseId} />
            )) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                Noch keine Portabilitätsentscheidungen vorhanden.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">Datenqualität · Import</div>
              <h2 className="mt-1 text-xl font-black">Gym-Übungen für Outdoor-Training anreichern</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Der Task betrachtet nur importierte bzw. aus Datensätzen stammende aktive Übungen. Portable Geräte bleiben erhalten. Automatische Ersetzungen verwenden ausschließlich explizit freigegebene Mappings; generische Maschinen oder fachlich mehrdeutige Geräte werden nicht geraten und bleiben im manuellen Review.
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
            <Info title="2. Ersetzen" text="Verwendet nur freigegebene Zuordnungen wie Cable → Resistance Band, Bench → Box oder Dumbbell → Kettlebell. Generische Machine-/Instabilitätsgeräte bleiben reviewpflichtig." />
            <Info title="3. Planbar machen" text="Speichert eigene Outdoor-Equipment-Anforderungen und eine DE/EN-Variantenbeschreibung. Der Outdoor-Training-Builder verwendet danach diese Ersatzgeräte." />
          </div>

          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm leading-6 text-[var(--muted)]">
            Eine Übung wird nur als outdoor-geeignet markiert, wenn alle erkannten Studio-Abhängigkeiten vollständig ersetzt werden können. Bereits migrierte Konvertierungen mit Systemtext bleiben einzeln reviewpflichtig und erhalten eine bewegungsspezifische Vorschau. Trainertexte werden nicht überschrieben. Nur neue, eindeutig sichere Vorschläge können gesammelt angewendet werden.
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
          <CatalogFilterPanel hasFilters={Boolean(searchQuery || statusFilter || page !== 1 || pageSize !== 12)} resetHref="/admin/outdoor-variants" title="Outdoor-Filter">
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
                  <option value="review-required">Fachreview offen</option>
                  <option value="review">Manuell prüfen</option>
                </select>
              </label>
              <CatalogPageSize options={[6, 12, 24]} value={pageSize} />
          </CatalogFilterPanel>
          <div className="min-w-0">
          <div className="mb-4 text-sm text-[var(--muted)]"><CatalogResultCount from={filteredCandidates.length ? (page - 1) * pageSize + 1 : 0} label={filteredCandidates.length === 1 ? "Übung" : "Übungen"} to={Math.min(page * pageSize, filteredCandidates.length)} total={filteredCandidates.length} /></div>
          {visibleCandidates.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">
              Keine importierte aktive Übung mit erkannter Studio-Equipment-Abhängigkeit gefunden.
            </div>
          ) : (
            <div className="catalog-results mt-5 space-y-3">
              {visibleCandidates.map((candidate) => <CandidateCard candidate={candidate} key={candidate.exerciseId} />)}
            </div>
          )}
          <CatalogPagination href={(nextPage) => pageHref(nextPage, searchQuery, statusFilter ?? "", pageSize)} label="Outdoor-Varianten" page={page} totalPages={Math.max(1, Math.ceil(filteredCandidates.length / pageSize))} />
          </div>
          </div>
        </section>
      </div></OverviewLayout>
    </AppShell>
  );
}

function PortabilityAuditRow({ entry }: { readonly entry: PortabilityAuditEntry }) {
  return (
    <article className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="font-black underline-offset-4 hover:underline" href={`/exercises/${entry.exerciseId}`}>
            {entry.name}
          </Link>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-black">
            {portabilityDispositionLabel(entry.disposition)}
          </span>
          {entry.reviewStatus === "pending" ? (
            <span className="rounded-full border border-[var(--warning)] bg-[var(--warning-bg)] px-2.5 py-1 text-xs font-black text-[var(--warning)]">Review offen</span>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-6">{entry.reason}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
          <span><strong>Quelle:</strong> {entry.sources}</span>
          <span><strong>Ersatz:</strong> {entry.replacementEquipment || "–"}</span>
          <span><strong>Review:</strong> {formatAuditTime(entry.reviewedAt)}{entry.reviewerName ? ` · ${entry.reviewerName}` : ""}</span>
        </div>
      </div>
      <Link className="grid min-h-9 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black" href={`/exercises/${entry.exerciseId}/edit`}>
        Prüfen
      </Link>
    </article>
  );
}

function portabilityDispositionLabel(value: PortabilityAuditEntry["disposition"]): string {
  if (value === "portable") return "Portabel";
  if (value === "converted") return "Konvertiert";
  return "Blockiert";
}

function formatAuditTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function pageHref(page: number, query: string, status: string, size: number): string {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (query) params.set("q", query);
  if (status) params.set("status", status);
  return "/admin/outdoor-variants?" + params.toString();
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
            {candidate.status === "ready" || candidate.status === "review-required" ? (
              <form action={approveOutdoorVariantCandidateAction}>
                <input name="exerciseId" type="hidden" value={candidate.exerciseId} />
                <button className="min-h-9 rounded-lg bg-[var(--control-strong)] px-3 text-xs font-black text-[var(--control-strong-foreground)]" type="submit">
                  {candidate.status === "review-required" ? "Variante fachlich freigeben" : "Diese Variante übernehmen"}
                </button>
              </form>
            ) : null}
          </div>
        </div>
        <StatusBadge status={candidate.status} />
      </div>

      <div className="view-secondary mt-3 flex flex-wrap gap-2">
        <MetaTag label="Bewegungsmuster" value={movementFamilyLabel(candidate.movementFamily)} />
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
  if (status === "existing") return { success: true, message: "Eine bestehende Trainer-Variante wurde beibehalten; Equipment und Fachreview wurden bestätigt." };
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
    "review-required": "Fachreview offen",
    unmappable: "Manuell prüfen",
    "missing-details": "Übungsdetails fehlen",
  };
  return <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black">{labels[status]}</span>;
}

function movementFamilyLabel(family: OutdoorVariantCandidatePreview["movementFamily"]): string {
  const labels: Record<OutdoorVariantCandidatePreview["movementFamily"], string> = {
    pull: "Zug",
    push: "Druck",
    squat: "Kniebeuge",
    hinge: "Hüftbeuge",
    lunge: "Ausfallschritt",
    carry: "Tragen / Ziehen",
    rotation: "Rotation",
    core: "Rumpf",
    locomotion: "Fortbewegung",
    generic: "Allgemein",
  };
  return labels[family];
}

function MetaTag({ label, value }: { readonly label: string; readonly value: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-bold"><span className="text-[var(--muted)]">{label}:</span><span>{value}</span></span>;
}

function Info({ title, text }: { readonly title: string; readonly text: string }) {
  return <article className="rounded-xl border border-[var(--border)] p-4"><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p></article>;
}
