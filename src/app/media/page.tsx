import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FilterSidePanel } from "@/components/layout/filter-side-panel";
import { MediaJobRefresh } from "@/components/media/media-job-refresh";
import {
  getMediaCatalogSummary,
  listMediaCatalog,
  listMediaGenerationCandidates,
  type MediaCatalogItem,
  type MediaGenerationCandidate,
} from "@/server/media/media-catalog-repository";
import {
  getMediaGenerationQueueSummary,
  listRecentMediaGenerationJobs,
  type RecentMediaGenerationJob,
} from "@/server/media/media-generation-job-repository";
import { queueMediaBatchAction, retryMediaGenerationJobAction, updateMediaReviewStatusAction } from "./actions";

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
    batchQueued?: string;
    batchSkipped?: string;
    batchError?: string;
    missingQ?: string;
    jobRetried?: string;
  }>;
}

export default async function MediaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const reviewStatus = allowed(params.review, ["pending", "approved", "rejected"]);
  const generationStatus = allowed(params.generation, ["generating", "generated", "failed"]);
  const sourceType = allowed(params.source, ["ai_generated", "club_created", "external_reference"]);
  const mediaType = allowed(params.type, ["image", "video", "illustration"]);
  const missingQuery = params.missingQ?.trim() ?? "";

  const [summary, assets, generationQueue, missingImageExercises, recentJobs] = await Promise.all([
    getMediaCatalogSummary(),
    listMediaCatalog({
      query,
      reviewStatus,
      generationStatus,
      sourceType,
      mediaType,
    }),
    getMediaGenerationQueueSummary(),
    listMediaGenerationCandidates(missingQuery, 24),
    listRecentMediaGenerationJobs(12),
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
        {params.batchQueued ? (
          <p className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
            {params.batchQueued} KI-Bildjob(s) wurden in die Warteschlange gestellt
            {Number(params.batchSkipped ?? 0) > 0 ? `; ${params.batchSkipped} Auswahl(en) waren bereits eingeplant oder nicht aktiv` : ""}.
          </p>
        ) : null}
        {params.batchError ? (
          <p className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">
            {batchErrorLabel(params.batchError)}
          </p>
        ) : null}
        {params.jobRetried ? (
          <p className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
            {params.jobRetried === "queued"
              ? "Der KI-Bildjob wurde erneut in die Warteschlange gestellt."
              : "Für diese Übung läuft bereits ein KI-Bildjob."}
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

        <div className="grid gap-4 lg:grid-cols-[max-content_minmax(0,1fr)] lg:items-start">
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

        <section className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div>
            <h2 className="text-base font-black">Batch-Operationen</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Markiere eine oder mehrere Übungen – entweder über vorhandene Medienkarten oder über die Liste ohne verwendbares Bild. „Neues Bild per KI erzeugen“ ergänzt ein neues Bild und lässt bestehende Medien unverändert. Die Generierung läuft nach dem Absenden asynchron weiter.
            </p>
            <form action={queueMediaBatchAction} className="mt-3 flex flex-wrap items-end gap-2" id="media-batch-form">
              <label className="grid gap-1 text-sm font-bold">
                Batch-Aktion
                <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" name="batchAction">
                  <option value="generate_ai_image">Neues Bild per KI erzeugen</option>
                </select>
              </label>
              <button className="min-h-11 rounded-xl bg-[var(--control-strong)] px-4 py-2 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">
                Für Auswahl starten
              </button>
            </form>
          </div>
          <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
            <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">KI-Bildjobs</div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 xl:grid-cols-2">
              <Data label="Wartend" value={String(generationQueue.queued)} />
              <Data label="Läuft" value={String(generationQueue.running)} />
              <Data label="Erfolgreich · 24 h" value={String(generationQueue.succeededRecent)} />
              <Data label="Fehler · 24 h" value={String(generationQueue.failedRecent)} />
            </dl>
            <MediaJobRefresh active={generationQueue.queued + generationQueue.running > 0} />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black">Übungen ohne verwendbares Bild</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  Hier kannst du auch Übungen auswählen, die noch gar keinen Medieneintrag besitzen oder nur fehlgeschlagene bzw. abgelehnte Bilder haben.
                </p>
              </div>
              <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs font-black">
                {missingImageExercises.length} angezeigt
              </span>
            </div>
            <form className="mt-3 flex flex-wrap gap-2" method="get">
              <label className="min-w-[260px] flex-1">
                <span className="sr-only">Übungen ohne Bild suchen</span>
                <input
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"
                  defaultValue={missingQuery}
                  name="missingQ"
                  placeholder="Übung, Kategorie oder Seed-Key suchen"
                />
              </label>
              <button className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-black" type="submit">
                Liste filtern
              </button>
              {missingQuery ? (
                <Link className="grid min-h-11 place-items-center rounded-xl border border-[var(--border)] px-4 text-sm font-black" href="/media">
                  Suche löschen
                </Link>
              ) : null}
            </form>
            <div className="mt-4 grid gap-2">
              {missingImageExercises.length ? (
                missingImageExercises.map((candidate) => <MediaGenerationCandidateRow candidate={candidate} key={candidate.exerciseId} />)
              ) : (
                <p className="rounded-xl bg-[var(--surface-subtle)] p-3 text-sm text-[var(--muted)]">
                  Keine passenden Übungen ohne verwendbares Bild gefunden.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
            <h2 className="text-base font-black">Letzte KI-Bildjobs</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Laufende und abgeschlossene Jobs bleiben nachvollziehbar. Fehlgeschlagene Jobs können direkt erneut eingeplant werden.
            </p>
            <div className="mt-4 grid gap-2">
              {recentJobs.length ? (
                recentJobs.map((job) => <RecentMediaJobRow job={job} key={job.id} />)
              ) : (
                <p className="rounded-xl bg-[var(--surface-subtle)] p-3 text-sm text-[var(--muted)]">Noch keine KI-Bildjobs vorhanden.</p>
              )}
            </div>
          </div>
        </section>

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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-xs font-black">
              <input form="media-batch-form" name="exerciseId" type="checkbox" value={asset.exerciseId} />
              Auswählen
            </label>
            <StatusBadge asset={asset} />
          </div>
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

function MediaGenerationCandidateRow({ candidate }: { readonly candidate: MediaGenerationCandidate }) {
  const state = candidate.activeJobCount > 0
    ? "Job läuft bereits"
    : candidate.failedImageCount > 0
      ? `${candidate.failedImageCount} fehlgeschlagen`
      : candidate.imageAssetCount > 0
        ? "Nur nicht verwendbare Bilder"
        : "Noch kein Bild";

  return (
    <article className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="truncate font-black">{candidate.exerciseName}</div>
        <div className="mt-1 text-xs text-[var(--muted)]">
          {candidate.category}{candidate.seedKey ? ` · ${candidate.seedKey}` : ""} · {state}
        </div>
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black">
        <input
          disabled={candidate.activeJobCount > 0}
          form="media-batch-form"
          name="exerciseId"
          type="checkbox"
          value={candidate.exerciseId}
        />
        {candidate.activeJobCount > 0 ? "Bereits eingeplant" : "Auswählen"}
      </label>
    </article>
  );
}

function RecentMediaJobRow({ job }: { readonly job: RecentMediaGenerationJob }) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link className="font-black underline-offset-4 hover:underline" href={`/exercises/${job.exerciseId}`}>
            {job.exerciseName}
          </Link>
          <div className="mt-1 text-xs text-[var(--muted)]">{jobStatusLabel(job.status)} · {formatJobTime(job.createdAt)}</div>
        </div>
        {job.status === "failed" ? (
          <form action={retryMediaGenerationJobAction}>
            <input name="exerciseId" type="hidden" value={job.exerciseId} />
            <button className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black" type="submit">
              Erneut versuchen
            </button>
          </form>
        ) : null}
      </div>
      {job.errorMessage ? (
        <p className="mt-2 break-words rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] p-2 text-xs font-bold text-[var(--danger)]">
          {job.errorMessage}
        </p>
      ) : null}
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


function jobStatusLabel(value: RecentMediaGenerationJob["status"]): string {
  if (value === "queued") return "Wartend";
  if (value === "running") return "Läuft";
  if (value === "succeeded") return "Erfolgreich";
  return "Fehlgeschlagen";
}

function formatJobTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function batchErrorLabel(value: string): string {
  if (value === "selection") return "Wähle mindestens eine Übung oder Medienkarte für die Batch-Operation aus.";
  if (value === "config") return "KI-Bildgenerierung ist nicht konfiguriert. OPENAI_API_KEY fehlt.";
  if (value === "action") return "Die gewählte Batch-Aktion ist ungültig.";
  return "Die Batch-Operation konnte nicht in die Warteschlange gestellt werden.";
}
