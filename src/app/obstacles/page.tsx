import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OverviewLayout } from "@/components/overview-layout";
import { CatalogFilterPanel, CatalogPageSize } from "@/components/catalog/catalog-filter-panel";
import { CatalogPagination } from "@/components/catalog/catalog-controls";
import { CatalogSummaryStrip } from "@/components/catalog/catalog-workspace";
import { RemoveObstacleAssignmentForm } from "@/components/obstacles/remove-obstacle-assignment-form";
import {
  getObstacleCatalogSummary,
  listObstacleCatalogPage,
  type ObstacleCatalogItem,
} from "@/server/obstacles/obstacle-catalog-repository";
import { listObstacleCandidates, type ObstacleCandidate } from "@/server/obstacles/obstacle-assignment-repository";
import { assignExerciseAsObstacleAction } from "./actions";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Alert } from "@/components/ui/feedback";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    q?: string;
    risk?: string;
    status?: string;
    candidateQ?: string;
    assignment?: string;
    assignmentError?: string;
    page?: string;
    size?: string;
  }>;
}

export default async function ObstaclesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const riskLevel = allowed(params.risk, ["low", "medium", "high"]);
  const archived = params.status === "archived";
  const candidateQuery = params.candidateQ?.trim() ?? "";
  const requestedSize = Number(params.size ?? "24");
  const pageSize = [12, 24, 48].includes(requestedSize) ? requestedSize : 24;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const [summary, obstaclePage, candidates] = await Promise.all([
    getObstacleCatalogSummary(),
    listObstacleCatalogPage({ query, riskLevel, archived, limit: pageSize, offset: (page - 1) * pageSize }),
    candidateQuery ? listObstacleCandidates(candidateQuery) : Promise.resolve([]),
  ]);
  const obstacles = obstaclePage.items;

  return (
    <AppShell
      title="Hinderniskatalog"
      subtitle="OCR-Hindernisse und obstacle-spezifische Übungen mit Aufbau, Sicherheitszone, Kapazität und Club-Abmessungen."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/exercises?category=ocr-skill">
            OCR-Übungen
          </Link>
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/media">
            Medien
          </Link>
        </div>
      )}
    >
      <OverviewLayout storageKey="ocrcraft-obstacles-view"><div className="space-y-6">
        {params.assignment === "added" ? (
          <Alert tone="success">
            Die Übung wurde als Hindernis übernommen. Vorhandene Übungsdaten wurden als Ausgangspunkt für die Hindernis-Guidance verwendet.
          </Alert>
        ) : null}
        {params.assignment === "already" ? (
          <Alert>
            Die Übung ist bereits als Hindernis zugeordnet.
          </Alert>
        ) : null}
        {params.assignment === "removed" ? (
          <Alert tone="success">
            Die Hindernis-Zuordnung wurde entfernt. Die Übung selbst bleibt vollständig erhalten.
          </Alert>
        ) : null}
        {params.assignmentError ? (
          <Alert tone="danger">
            Die Hindernis-Zuordnung konnte nicht geändert werden.
          </Alert>
        ) : null}
        <CatalogSummaryStrip items={[
          { label: "Gefiltert", value: obstaclePage.total },
          { label: "Aktiv", value: summary.active },
          { label: "Archiviert", value: summary.archived },
          { label: "Hohes Risiko", value: summary.highRisk },
          { label: "Mit Club-Maßen", value: summary.withClubDimensions },
        ]} />

        <div className="catalog-workspace grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <CatalogFilterPanel hasFilters={Boolean(query || riskLevel || archived || page !== 1 || pageSize !== 24)} resetHref="/obstacles" title="Hindernisfilter">
          <label className="grid gap-1 text-sm font-bold">
            Suchen
            <input
              className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
              defaultValue={query}
              name="q"
              placeholder="z. B. Wall, Rig, Cargo Net, Rope ..."
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Risiko
            <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={riskLevel} name="risk">
              <option value="">Alle</option>
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Status
            <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={archived ? "archived" : "active"} name="status">
              <option value="active">Aktiv</option>
              <option value="archived">Archiviert</option>
            </select>
          </label>
          <CatalogPageSize options={[12, 24, 48]} value={pageSize} />
        </CatalogFilterPanel>
        <div className="min-w-0 space-y-6">

        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-black">Bestehende Übung als Hindernis übernehmen</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Suche im aktiven Übungskatalog. Die Übung wird nicht dupliziert, sondern erhält strukturierte Hindernis-Guidance.
              </p>
            </div>
            <Link className="shrink-0 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-black" href="/exercises">
              Übungskatalog öffnen
            </Link>
          </div>
          <form className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row" method="get">
            <label className="min-w-0 flex-1"><span className="sr-only">Bestehende Übung suchen</span><input className="h-11 w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3" defaultValue={candidateQuery} name="candidateQ" placeholder="Übung suchen, z. B. Box, Hang, Carry ..." /></label>
            <button className="min-h-11 shrink-0 rounded-md bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">Übungen suchen</button>
          </form>
          {candidateQuery ? candidates.length ? <div className="mt-4 grid gap-2">{candidates.map((candidate) => <ObstacleCandidateRow candidate={candidate} key={candidate.exerciseId} />)}</div> : <p className="mt-4 rounded-md bg-[var(--surface-subtle)] p-3 text-sm text-[var(--muted)]">Keine noch nicht zugeordneten aktiven Übungen für „{candidateQuery}“ gefunden.</p> : null}
        </section>

        {obstacles.length ? (
          <section className="catalog-results grid gap-4 xl:grid-cols-2">
            {obstacles.map((obstacle) => <ObstacleCard obstacle={obstacle} key={obstacle.exerciseId} />)}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
            <h2 className="text-lg font-black">Keine Hindernisse gefunden</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Der Hinderniskatalog zeigt Übungen, für die strukturierte obstacle-spezifische Guidance hinterlegt ist.
            </p>
          </section>
        )}
        </div>
        <CatalogPagination href={(nextPage) => pageHref(nextPage, query, riskLevel, archived, pageSize)} label="Hindernisse" page={page} totalPages={Math.max(1, Math.ceil(obstaclePage.total / pageSize))} />
        </div>
      </div></OverviewLayout>
    </AppShell>
  );
}

function pageHref(page: number, query: string, risk: string, archived: boolean, size: number): string {
  const params = new URLSearchParams({ page: String(page), size: String(size), status: archived ? "archived" : "active" });
  if (query) params.set("q", query);
  if (risk) params.set("risk", risk);
  return "/obstacles?" + params.toString();
}

function ObstacleCard({ obstacle }: { readonly obstacle: ObstacleCatalogItem }) {
  return (
    <Card as="article" className="catalog-card min-w-0 overflow-hidden">
      <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="min-h-44 bg-[var(--surface-subtle)]">
          {obstacle.imageUrl ? (
            <ImageLightbox alt={`${obstacle.name} · Hindernisvorschau`} className="h-full w-full object-contain" containerClassName="relative h-full min-h-44" src={obstacle.imageUrl} />
          ) : (
            <div className="grid h-full min-h-44 place-items-center p-4 text-center text-xs font-bold text-[var(--muted)]">
              Kein generiertes Medium vorhanden
            </div>
          )}
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">
                {obstacle.category} · {riskLabel(obstacle.riskLevel)}
              </div>
              <h2 className="mt-1 text-xl font-black">{obstacle.name}</h2>
              {obstacle.seedKey ? <div className="mt-1 font-mono text-xs text-[var(--muted)]">{obstacle.seedKey}</div> : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {obstacle.indoorSuitable ? <Badge>Indoor</Badge> : null}
              {obstacle.outdoorSuitable ? <Badge>Outdoor</Badge> : null}
              {obstacle.supervision ? <Badge>{supervisionLabel(obstacle.supervision)}</Badge> : null}
            </div>
          </div>

          <dl className="view-secondary grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <Data label="Stationskapazität" value={String(obstacle.stationCapacity)} />
            <Data label="Freizone" value={`${obstacle.clearZoneMetres.toFixed(1)} m`} />
            <Data label="Mindestalter" value={obstacle.minAge == null ? "–" : `ab ${obstacle.minAge}`} />
            <Data label="Club-Maße" value={dimensionLabel(obstacle)} />
          </dl>

          {obstacle.equipment.length ? (
            <div className="view-secondary flex flex-wrap gap-1.5">
              {obstacle.equipment.map((item) => <Badge key={item}>{item}</Badge>)}
            </div>
          ) : null}

          <section className="view-detail rounded-xl bg-[var(--surface-subtle)] p-3">
            <h3 className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">Aufbau</h3>
            <p className="mt-1 text-sm leading-6">{obstacle.equipmentConfiguration}</p>
          </section>

          <details className="view-detail rounded-xl border border-[var(--border)] p-3">
            <summary className="cursor-pointer text-sm font-black">Ablauf, Voraussetzung & Regression</summary>
            <div className="mt-3 space-y-3 text-sm leading-6">
              <Guidance label="Voraussetzung" value={obstacle.prerequisites} />
              <Guidance label="Annäherung" value={obstacle.approach} />
              <Guidance label="Ausführung" value={obstacle.execution} />
              <Guidance label="Ausstieg / Reset" value={obstacle.exitReset} />
              <Guidance label="Fallback" value={obstacle.fallbackExercise} />
            </div>
          </details>

          <div className="view-actions flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
            <Link className="rounded-lg bg-[var(--control-strong)] px-3 py-2 text-xs font-black text-[var(--control-strong-foreground)]" href={`/exercises/${obstacle.exerciseId}`}>
              Übung öffnen
            </Link>
            <Link className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" href={`/exercises/${obstacle.exerciseId}/edit#obstacle-guidance`}>
              Hindernis bearbeiten
            </Link>
            <RemoveObstacleAssignmentForm exerciseId={obstacle.exerciseId} exerciseName={obstacle.name} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function ObstacleCandidateRow({ candidate }: { readonly candidate: ObstacleCandidate }) {
  return (
    <article className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
      <div className="h-16 overflow-hidden rounded-lg bg-[var(--surface)]">
        {candidate.imageUrl ? (
          <ImageLightbox alt={`${candidate.name} · Hindernisvorschau`} className="h-full w-full object-contain" containerClassName="relative h-full" src={candidate.imageUrl} />
        ) : (
          <div className="grid h-full place-items-center text-[10px] font-bold text-[var(--muted)]">Kein Bild</div>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-black">{candidate.name}</div>
        <div className="mt-1 text-xs text-[var(--muted)]">
          {candidate.category} · {riskLabel(candidate.riskLevel)}
          {candidate.seedKey ? ` · ${candidate.seedKey}` : ""}
        </div>
      </div>
      <form action={assignExerciseAsObstacleAction} className="flex flex-wrap justify-end gap-2">
        <input name="exerciseId" type="hidden" value={candidate.exerciseId} />
        <button className="min-h-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-black" name="next" type="submit" value="catalog">
          Übernehmen
        </button>
        <button className="min-h-11 rounded-lg bg-[var(--control-strong)] px-3 py-2 text-xs font-black text-[var(--control-strong-foreground)]" name="next" type="submit" value="edit">
          Übernehmen & prüfen
        </button>
      </form>
    </article>
  );
}

function Badge({ children }: { readonly children: React.ReactNode }) {
  return <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-bold">{children}</span>;
}

function Data({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-subtle)] p-2">
      <dt className="font-bold text-[var(--muted)]">{label}</dt>
      <dd className="mt-0.5 font-black">{value}</dd>
    </div>
  );
}

function Guidance({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <div className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">{label}</div>
      <p className="mt-0.5">{value || "–"}</p>
    </div>
  );
}

function allowed(value: string | undefined, values: readonly string[]): string {
  return value && values.includes(value) ? value : "";
}

function riskLabel(value: string): string {
  if (value === "high") return "Hohes Risiko";
  if (value === "medium") return "Mittleres Risiko";
  return "Niedriges Risiko";
}

function supervisionLabel(value: string): string {
  if (value === "direct") return "Direkte Aufsicht";
  if (value === "increased") return "Erhöhte Aufsicht";
  return value;
}

function dimensionLabel(obstacle: ObstacleCatalogItem): string {
  const dimensions = [
    obstacle.clubHeightCm == null ? null : `H ${formatCm(obstacle.clubHeightCm)}`,
    obstacle.clubSpanCm == null ? null : `Spanne ${formatCm(obstacle.clubSpanCm)}`,
    obstacle.clubReachCm == null ? null : `Reach ${formatCm(obstacle.clubReachCm)}`,
  ].filter(Boolean);
  return dimensions.length ? dimensions.join(" · ") : "nicht gepflegt";
}

function formatCm(value: number): string {
  return Number.isInteger(value) ? `${value} cm` : `${value.toFixed(1)} cm`;
}
