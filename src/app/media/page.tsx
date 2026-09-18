import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FilterSidePanel } from "@/components/layout/filter-side-panel";
import { MediaJobRefresh } from "@/components/media/media-job-refresh";
import { OrphanedMediaCleanupForm } from "@/components/media/orphaned-media-cleanup-form";
import { ExternalMediaManager } from "@/components/media/external-media-manager";
import { VideoPopoverButton } from "@/components/media/video-popover-button";
import {
  getMediaCatalogSummary,
  listMediaCatalog,
  listMediaGenerationCandidates,
  listLegacyTriptychMigrationCandidates,
  type LegacyTriptychMigrationCandidate,
  type MediaCatalogItem,
  type MediaGenerationCandidate,
} from "@/server/media/media-catalog-repository";
import {
  getMediaGenerationQueueSummary,
  listRecentMediaGenerationJobs,
  type RecentMediaGenerationJob,
} from "@/server/media/media-generation-job-repository";
import { cleanupOrphanedMediaAction, deleteExternalMediaAction, finalizeLegacyTriptychMigrationAction, queueMediaBatchAction, retryMediaGenerationJobAction, saveExternalMediaAction, updateMediaReviewStatusAction, updateSequenceMediaAssessmentAction } from "./actions";
import { getLegacyMediaMigrationState, legacyMediaMigrationStateLabel } from "@/server/media/legacy-media-migration-core";
import { canApproveMediaReview } from "@/server/media/media-review-core";
import { getMediaMaintenanceSummary } from "@/server/media/media-maintenance-service";

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
    cleanupRemoved?: string;
    cleanupError?: string;
    externalSaved?: string;
    externalDeleted?: string;
    externalError?: string;
    legacyRetired?: string;
    legacyError?: string;
    sequenceSaved?: string;
    sequenceError?: string;
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

  const [summary, assets, generationQueue, missingImageExercises, recentJobs, maintenance, legacyCandidates] = await Promise.all([
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
    getMediaMaintenanceSummary(),
    listLegacyTriptychMigrationCandidates(40),
  ]);

  return (
    <AppShell
      title="Medienkatalog"
      subtitle="Bilder, Illustrationen und Videos des Übungskatalogs mit Herkunft, Generierungs- und Reviewstatus."
      actions={(
        <div className="flex flex-wrap gap-2">
          <ExternalMediaManager deleteAction={deleteExternalMediaAction} saveAction={saveExternalMediaAction} />
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
            {params.reviewError === "blocked"
              ? "Freigabe ist noch gesperrt: externe Rechte/Einwilligung bzw. Biomechanik- und Textprüfung müssen vollständig bestanden sein."
              : "Reviewstatus konnte nicht gespeichert werden."}
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
        {params.cleanupRemoved ? (
          <p className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
            {params.cleanupRemoved} nicht referenzierte Storage-Objekt(e) wurden entfernt.
          </p>
        ) : null}
        {params.cleanupError ? (
          <p className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">
            Die Medienbereinigung konnte nicht vollständig ausgeführt werden.
          </p>
        ) : null}
        {params.externalSaved ? (
          <p className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
            Externes Medium wurde gespeichert.
          </p>
        ) : null}
        {params.externalDeleted ? (
          <p className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
            Externes Medium wurde entfernt.
          </p>
        ) : null}
        {params.externalError ? (
          <p className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">
            Externes Medium konnte nicht gespeichert werden. Prüfe HTTPS-URLs, Lizenz und Einwilligungsstatus.
          </p>
        ) : null}
        {params.legacyRetired ? (
          <p className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
            {params.legacyRetired} Legacy-Triptychon-Asset(s) wurden nach Freigabe der Sequenz als ersetzt markiert.
          </p>
        ) : null}
        {params.legacyError ? (
          <p className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">
            {params.legacyError === "approval"
              ? "Die Migration kann erst abgeschlossen werden, wenn mindestens eine erzeugte Sequenz fachlich freigegeben wurde."
              : "Die Legacy-Migration konnte nicht abgeschlossen werden."}
          </p>
        ) : null}
        {params.sequenceSaved ? (
          <p className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">
            Sequenzprüfung wurde gespeichert.
          </p>
        ) : null}
        {params.sequenceError ? (
          <p className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">
            Die fachliche Sequenzprüfung konnte nicht gespeichert werden.
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

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">Legacy-Triptychon → Sequenzbild</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Alte dreiteilige AI-Illustrationen werden nicht automatisch überschrieben. Zuerst wird eine neue Bewegungssequenz erzeugt und fachlich geprüft; erst nach deren Freigabe kann das Legacy-Asset als ersetzt markiert werden.
              </p>
            </div>
            <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs font-black">{legacyCandidates.length} offen</span>
          </div>
          <div className="mt-4 grid gap-2">
            {legacyCandidates.length ? legacyCandidates.map((candidate) => (
              <LegacyMigrationRow candidate={candidate} key={candidate.exerciseId} />
            )) : (
              <p className="rounded-xl bg-[var(--surface-subtle)] p-3 text-sm text-[var(--muted)]">
                Keine aktiven Legacy-Triptychon-Assets mehr zu migrieren.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-black">Medien-Wartung</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                OCRCraft vergleicht die im konfigurierten {maintenance.storageProvider === "s3" ? "S3-Storage" : "Dateisystem"} vorhandenen Objekte mit den in DuckDB referenzierten Medien. Automatisch löschbar sind ausschließlich Objekte ohne Datenbankreferenz.
              </p>
            </div>
            {maintenance.available ? <OrphanedMediaCleanupForm action={cleanupOrphanedMediaAction} count={maintenance.orphanedObjectCount} /> : null}
          </div>
          {!maintenance.available ? (
            <p className="mt-4 rounded-xl border border-[var(--warning)] bg-[var(--warning-bg)] p-3 text-sm font-bold text-[var(--warning)]">
              {maintenance.errorMessage}
            </p>
          ) : null}
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Data label="Storage-Objekte" value={String(maintenance.storedObjectCount)} />
            <Data label="DB-Referenzen" value={String(maintenance.referencedObjectCount)} />
            <Data label="Verwaist" value={String(maintenance.orphanedObjectCount)} />
            <Data label="Referenz fehlt im Storage" value={String(maintenance.missingObjectCount)} />
          </dl>
          {maintenance.orphanedKeys.length ? (
            <div className="mt-4 rounded-xl bg-[var(--surface-subtle)] p-3">
              <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">Verwaiste Objekte</div>
              <ul className="mt-2 grid gap-1 font-mono text-xs text-[var(--muted)]">
                {maintenance.orphanedKeys.map((key) => <li className="truncate" key={key}>{key}</li>)}
              </ul>
            </div>
          ) : null}
          {maintenance.missingAssets.length ? (
            <div className="mt-4 rounded-xl border border-[var(--warning)] bg-[var(--warning-bg)] p-3">
              <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--warning)]">Fehlende Storage-Objekte – nur prüfen, keine automatische Löschung</div>
              <ul className="mt-2 grid gap-2 text-xs">
                {maintenance.missingAssets.map((asset) => (
                  <li className="flex flex-wrap justify-between gap-2" key={asset.assetId}>
                    <Link className="font-black underline underline-offset-2" href={`/exercises/${asset.exerciseId}`}>{asset.exerciseName}</Link>
                    <span className="max-w-full truncate font-mono text-[var(--muted)]">{asset.storageKey}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
  const approvalReady = canApproveMediaReview({
    sourceType: asset.sourceType,
    illustrationFormat: asset.illustrationFormat,
    rightsStatus: asset.rightsStatus,
    licenseLabel: asset.licenseLabel,
    sourceReference: asset.sourceReference,
    consentRequired: asset.consentRequired,
    consentConfirmed: asset.consentConfirmed,
    biomechanicsReview: asset.biomechanicsReview,
    textMatchReview: asset.textMatchReview,
  });
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="aspect-[16/10] bg-[var(--surface-subtle)]">
        {asset.mediaType === "video" && asset.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${asset.exerciseName} · Video-Thumbnail`} className="h-full w-full object-contain" loading="lazy" src={asset.thumbnailUrl} />
        ) : asset.imageUrl && asset.mediaType !== "video" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${asset.exerciseName} · Medienvorschau`} className="h-full w-full object-contain" loading="lazy" src={asset.imageUrl} />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-sm font-bold text-[var(--muted)]">
            {asset.mediaType === "video" ? "Video vorhanden · ohne Thumbnail" : "Keine aufrufbare Vorschau gespeichert"}
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
          <Data label="Rechte" value={rightsLabel(asset.rightsStatus)} />
          <Data label="Einwilligung" value={asset.consentRequired ? (asset.consentConfirmed ? "Bestätigt" : "Fehlt") : "Nicht erforderlich"} />
        </dl>

        {(asset.provider || asset.model || asset.styleProfile) ? (
          <p className="text-xs leading-5 text-[var(--muted)]">
            {[asset.provider, asset.model, asset.styleProfile].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {asset.licenseLabel ? <p className="text-xs font-bold">Lizenz: {asset.licenseLabel}</p> : null}
        {asset.attributionText ? <p className="text-xs text-[var(--muted)]">Attribution: {asset.attributionText}</p> : null}
        {asset.usageNote ? <p className="text-xs text-[var(--muted)]">{asset.usageNote}</p> : null}
        {asset.errorMessage ? <p className="rounded-lg border border-[var(--danger)] bg-[var(--danger-bg)] p-2 text-xs font-bold text-[var(--danger)]">{asset.errorMessage}</p> : null}

        {asset.sourceType === "ai_generated" && asset.illustrationFormat === "exercise_sequence" && asset.generationStatus === "generated" ? (
          <form action={updateSequenceMediaAssessmentAction} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
            <input name="assetId" type="hidden" value={asset.id} />
            <input name="exerciseId" type="hidden" value={asset.exerciseId} />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">Fachliche Sequenzprüfung</div>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Vergleiche jede dargestellte Phase mit den strukturierten Ausführungsschritten und prüfe Haltung, Bewegungsrichtung, Gelenkpositionen, Equipment und sichere Übergänge.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <ReviewSelect label="Biomechanische Plausibilität" name="biomechanicsReview" value={asset.biomechanicsReview} />
              <ReviewSelect label="Übereinstimmung mit Ausführungstext" name="textMatchReview" value={asset.textMatchReview} />
            </div>
            <label className="grid gap-1 text-xs font-bold">
              Review-Notiz
              <textarea
                className="min-h-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 font-normal"
                defaultValue={asset.reviewNotes ?? ""}
                maxLength={2000}
                name="reviewNotes"
                placeholder="Abweichungen, Korrekturhinweise oder Freigabebegründung"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[var(--muted)]">
                {asset.reviewerName && asset.reviewedAt ? `Zuletzt geprüft von ${asset.reviewerName} · ${formatJobTime(asset.reviewedAt)}` : "Noch nicht fachlich geprüft"}
              </span>
              <button className="min-h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black" type="submit">
                Prüfung speichern
              </button>
            </div>
          </form>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
          <form action={updateMediaReviewStatusAction} className="flex flex-wrap gap-2">
            <input name="assetId" type="hidden" value={asset.id} />
            <input name="exerciseId" type="hidden" value={asset.exerciseId} />
            {asset.reviewStatus !== "approved" && approvalReady ? (
              <button className="rounded-lg bg-[var(--control-strong)] px-3 py-2 text-xs font-black text-[var(--control-strong-foreground)]" name="reviewStatus" type="submit" value="approved">
                Freigeben
              </button>
            ) : asset.reviewStatus !== "approved" ? (
              <span className="grid min-h-9 place-items-center rounded-lg border border-[var(--warning)] bg-[var(--warning-bg)] px-3 text-xs font-black text-[var(--warning)]">
                Freigabeprüfung offen
              </span>
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
            Übung bearbeiten
          </Link>
          {asset.mediaType === "video" && asset.imageUrl ? (
            <VideoPopoverButton title={asset.exerciseName} videoUrl={asset.imageUrl} thumbnailUrl={asset.thumbnailUrl} />
          ) : null}
          {asset.sourceType === "external_reference" && asset.imageUrl ? (
            <ExternalMediaManager
              deleteAction={deleteExternalMediaAction}
              saveAction={saveExternalMediaAction}
              value={{
                id: asset.id,
                exerciseId: asset.exerciseId,
                exerciseName: asset.exerciseName,
                mediaType: asset.mediaType === "video" ? "video" : "image",
                mediaUrl: asset.imageUrl,
                thumbnailUrl: asset.thumbnailUrl,
                provider: asset.provider,
                sourceReference: asset.sourceReference,
                licenseLabel: asset.licenseLabel,
                attributionText: asset.attributionText,
                usageNote: asset.usageNote,
                rightsStatus: asset.rightsStatus,
                consentRequired: asset.consentRequired,
                consentConfirmed: asset.consentConfirmed,
              }}
            />
          ) : null}
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

function LegacyMigrationRow({ candidate }: { readonly candidate: LegacyTriptychMigrationCandidate }) {
  const state = getLegacyMediaMigrationState(candidate);
  return (
    <article className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <Link className="font-black underline-offset-4 hover:underline" href={`/exercises/${candidate.exerciseId}`}>
          {candidate.exerciseName}
        </Link>
        <div className="mt-1 text-xs text-[var(--muted)]">
          {candidate.legacyAssetCount} Legacy · {candidate.pendingSequenceCount} Sequenz(en) im Review · {legacyMediaMigrationStateLabel(state)}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {state === "needs_generation" ? (
          <form action={queueMediaBatchAction}>
            <input name="batchAction" type="hidden" value="generate_ai_image" />
            <input name="exerciseId" type="hidden" value={candidate.exerciseId} />
            <button className="min-h-10 rounded-lg bg-[var(--control-strong)] px-3 text-xs font-black text-[var(--control-strong-foreground)]" type="submit">
              Sequenz erzeugen
            </button>
          </form>
        ) : null}
        {state === "review_pending" ? (
          <Link className="grid min-h-10 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black" href={`/media?q=${encodeURIComponent(candidate.exerciseName)}&review=pending`}>
            Sequenz prüfen
          </Link>
        ) : null}
        {state === "generating" ? (
          <span className="grid min-h-10 place-items-center rounded-lg border border-[var(--border)] px-3 text-xs font-black text-[var(--muted)]">
            Job läuft
          </span>
        ) : null}
        {state === "ready_to_finalize" ? (
          <form action={finalizeLegacyTriptychMigrationAction}>
            <input name="exerciseId" type="hidden" value={candidate.exerciseId} />
            <button className="min-h-10 rounded-lg border border-[var(--danger)] px-3 text-xs font-black text-[var(--danger)]" type="submit">
              Legacy als ersetzt markieren
            </button>
          </form>
        ) : null}
      </div>
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

function ReviewSelect({
  label,
  name,
  value,
}: {
  readonly label: string;
  readonly name: string;
  readonly value: "unreviewed" | "pass" | "needs_changes";
}) {
  return (
    <label className="grid gap-1 text-xs font-bold">
      {label}
      <select className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 font-normal" defaultValue={value} name={name}>
        <option value="unreviewed">Noch nicht geprüft</option>
        <option value="pass">Bestanden</option>
        <option value="needs_changes">Korrektur erforderlich</option>
      </select>
    </label>
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

function rightsLabel(value: string): string {
  if (value === "approved") return "Geprüft";
  if (value === "restricted") return "Eingeschränkt";
  return "Noch zu prüfen";
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
  if (value === "config") return "KI-Bildgenerierung ist nicht konfiguriert. Weise in Administration → Einstellungen mindestens einen aktiven Bild-AI-Provider zu.";
  if (value === "action") return "Die gewählte Batch-Aktion ist ungültig.";
  return "Die Batch-Operation konnte nicht in die Warteschlange gestellt werden.";
}

