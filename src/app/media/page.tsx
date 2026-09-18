import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FilterSidePanel } from "@/components/layout/filter-side-panel";
import {
  getMediaCatalogSummary,
  listMediaCatalog,
  type MediaCatalogItem,
} from "@/server/media/media-catalog-repository";
import { updateMediaReviewStatusAction } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    q?: string;
    review?: string;
    generation?: string;
    source?: string;
    type?: string;
    reviewSaved?: string;
    reviewError?: string;
  }>;
}

export default async function MediaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const reviewStatus = allowed(params.review, ["pending", "approved", "rejected"]);
  const generationStatus = allowed(params.generation, ["generating", "generated", "failed"]);
  const sourceType = allowed(params.source, ["ai_generated", "club_created", "external_reference"]);
  const mediaType = allowed(params.type, ["image", "video", "illustration"]);

  const [summary, assets] = await Promise.all([
    getMediaCatalogSummary(),
    listMediaCatalog({
      query,
      reviewStatus,
      generationStatus,
      sourceType,
      mediaType,
    }),
  ]);

  return (
    <AppShell
      title="Medienkatalog"
      subtitle="Bilder, Illustrationen und Videos des Übungskatalogs mit Herkunft, Generierungs- und Reviewstatus."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/exercises">
            Übungskatalog
          </Link>
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/obstacles">
            Hindernisse
          </Link>
        </div>
      )}
    >
      <div className="space-y-6">
        {params.reviewSaved ? (
          <p className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
            Medienreview gespeichert: {reviewLabel(params.reviewSaved)}.
          </p>
        ) : null}
        {params.reviewError ? (
          <p className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">
            Reviewstatus konnte nicht gespeichert werden.
          </p>
        ) : null}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="Gesamt" value={summary.total} />
          <Metric label="Generiert" value={summary.generated} />
          <Metric label="Review offen" value={summary.pendingReview} />
          <Metric label="Freigegeben" value={summary.approved} />
          <Metric label="Abgelehnt" value={summary.rejected} />
          <Metric label="Fehlgeschlagen" value={summary.failed} />
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <FilterSidePanel title="Medienfilter">
        <form
          className="grid min-w-0 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1"
          method="get"
        >
          <label className="grid gap-1 text-sm font-bold">
            Suchen
            <input
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
              defaultValue={query}
              name="q"
              placeholder="Übung oder Seed-Key"
            />
          </label>
          <FilterSelect label="Review" name="review" value={reviewStatus} options={[
            ["", "Alle"],
            ["pending", "Offen"],
            ["approved", "Freigegeben"],
            ["rejected", "Abgelehnt"],
          ]} />
          <FilterSelect label="Generierung" name="generation" value={generationStatus} options={[
            ["", "Alle"],
            ["generated", "Generiert"],
            ["generating", "In Arbeit"],
            ["failed", "Fehlgeschlagen"],
          ]} />
          <FilterSelect label="Quelle" name="source" value={sourceType} options={[
            ["", "Alle"],
            ["ai_generated", "AI-generiert"],
            ["club_created", "Verein"],
            ["external_reference", "Extern"],
          ]} />
          <FilterSelect label="Medientyp" name="type" value={mediaType} options={[
            ["", "Alle"],
            ["illustration", "Illustration"],
            ["image", "Bild"],
            ["video", "Video"],
          ]} />
          <button className="self-end rounded-xl bg-[var(--control-strong)] px-5 py-3 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">
            Filtern
          </button>
        </form>
        </FilterSidePanel>
        <div className="min-w-0 space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <span>{assets.length} Medien im aktuellen Filter</span>
          {(query || reviewStatus || generationStatus || sourceType || mediaType) ? (
            <Link className="font-black underline underline-offset-4" href="/media">Filter zurücksetzen</Link>
          ) : null}
        </div>

        {assets.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => <MediaCard asset={asset} key={asset.id} />)}
          </section>
        ) : (
          <EmptyState />
        )}
        </div>
        </div>
      </div>
    </AppShell>
  );
}

function MediaCard({ asset }: { readonly asset: MediaCatalogItem }) {
  const sourceHref = safeHttps(asset.sourceReference);
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="aspect-[16/10] bg-[var(--surface-subtle)]">
        {asset.imageUrl && asset.mediaType !== "video" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${asset.exerciseName} · Medienvorschau`} className="h-full w-full object-contain" loading="lazy" src={asset.imageUrl} />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-sm font-bold text-[var(--muted)]">
            {asset.mediaType === "video" ? "Video-Metadaten · keine Inline-Vorschau" : "Keine aufrufbare Vorschau gespeichert"}
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">
              {mediaTypeLabel(asset.mediaType)} · {sourceTypeLabel(asset.sourceType)}
            </div>
            <h2 className="mt-1 truncate text-lg font-black">{asset.exerciseName}</h2>
            {asset.seedKey ? <div className="mt-1 font-mono text-xs text-[var(--muted)]">{asset.seedKey}</div> : null}
          </div>
          <StatusBadge asset={asset} />
        </div>

        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          <Data label="Review" value={reviewLabel(asset.reviewStatus)} />
          <Data label="Status" value={generationLabel(asset.generationStatus)} />
          <Data label="Format" value={asset.illustrationFormat ?? "–"} />
          <Data label="Sequenz" value={asset.sequenceStepCount == null ? "–" : `${asset.sequenceStepCount} Schritte`} />
          <Data label="Größe" value={asset.width && asset.height ? `${asset.width} × ${asset.height}` : "–"} />
          <Data label="Content-Type" value={asset.contentType ?? "–"} />
        </dl>

        {(asset.provider || asset.model || asset.styleProfile) ? (
          <p className="text-xs leading-5 text-[var(--muted)]">
            {[asset.provider, asset.model, asset.styleProfile].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {asset.licenseLabel ? <p className="text-xs font-bold">Lizenz: {asset.licenseLabel}</p> : null}
        {asset.errorMessage ? <p className="rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] p-2 text-xs font-bold text-[var(--danger)]">{asset.errorMessage}</p> : null}

        <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
          <form action={updateMediaReviewStatusAction} className="flex flex-wrap gap-2">
            <input name="assetId" type="hidden" value={asset.id} />
            <input name="exerciseId" type="hidden" value={asset.exerciseId} />
            {asset.reviewStatus !== "approved" ? (
              <button className="rounded-lg bg-[var(--control-strong)] px-3 py-2 text-xs font-black text-[var(--control-strong-foreground)]" name="reviewStatus" type="submit" value="approved">
                Freigeben
              </button>
            ) : null}
            {asset.reviewStatus !== "rejected" ? (
              <button className="rounded-lg border border-[var(--danger)] px-3 py-2 text-xs font-black text-[var(--danger)]" name="reviewStatus" type="submit" value="rejected">
                Ablehnen
              </button>
            ) : null}
            {asset.reviewStatus !== "pending" ? (
              <button className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" name="reviewStatus" type="submit" value="pending">
                Review öffnen
              </button>
            ) : null}
          </form>
          <Link className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" href={`/exercises/${asset.exerciseId}`}>
            Übung öffnen
          </Link>
          <Link className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" href={`/exercises/${asset.exerciseId}/edit`}>
            Bearbeiten
          </Link>
          {sourceHref ? (
            <a className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" href={sourceHref} rel="noreferrer" target="_blank">
              Quelle
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs font-bold text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

function Data({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-subtle)] p-2">
      <dt className="font-bold text-[var(--muted)]">{label}</dt>
      <dd className="mt-0.5 break-words font-black">{value}</dd>
    </div>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  readonly label: string;
  readonly name: string;
  readonly value: string;
  readonly options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      {label}
      <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={value} name={name}>
        {options.map(([id, text]) => <option key={id || "all"} value={id}>{text}</option>)}
      </select>
    </label>
  );
}

function StatusBadge({ asset }: { readonly asset: MediaCatalogItem }) {
  const label = asset.generationStatus === "failed"
    ? "Fehler"
    : asset.generationStatus === "generating"
      ? "In Arbeit"
      : reviewLabel(asset.reviewStatus);
  return (
    <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-black">
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
      <h2 className="text-lg font-black">Keine Medien gefunden</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
        Der aktuelle Filter trifft auf keinen Medieneintrag. Medien werden immer einer Übung zugeordnet und bleiben über deren Datensatz nachvollziehbar.
      </p>
    </section>
  );
}

function allowed(value: string | undefined, values: readonly string[]): string {
  return value && values.includes(value) ? value : "";
}

function reviewLabel(value: string): string {
  if (value === "approved") return "Freigegeben";
  if (value === "rejected") return "Abgelehnt";
  return "Review offen";
}

function generationLabel(value: string): string {
  if (value === "generated") return "Generiert";
  if (value === "failed") return "Fehlgeschlagen";
  return "In Arbeit";
}

function sourceTypeLabel(value: string): string {
  if (value === "ai_generated") return "AI";
  if (value === "club_created") return "Verein";
  if (value === "external_reference") return "Extern";
  return value;
}

function mediaTypeLabel(value: string): string {
  if (value === "illustration") return "Illustration";
  if (value === "image") return "Bild";
  if (value === "video") return "Video";
  return value;
}

function safeHttps(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
