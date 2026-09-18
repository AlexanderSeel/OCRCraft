import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  getObstacleCatalogSummary,
  listObstacleCatalog,
  type ObstacleCatalogItem,
} from "@/server/obstacles/obstacle-catalog-repository";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{
    q?: string;
    risk?: string;
    status?: string;
  }>;
}

export default async function ObstaclesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const riskLevel = allowed(params.risk, ["low", "medium", "high"]);
  const archived = params.status === "archived";

  const [summary, obstacles] = await Promise.all([
    getObstacleCatalogSummary(),
    listObstacleCatalog({ query, riskLevel, archived }),
  ]);

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
      <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Aktiv" value={summary.active} />
          <Metric label="Archiviert" value={summary.archived} />
          <Metric label="Hohes Risiko" value={summary.highRisk} />
          <Metric label="Mit Club-Maßen" value={summary.withClubDimensions} />
        </section>

        <form
          className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] md:grid-cols-[minmax(0,2fr)_180px_180px_auto]"
          method="get"
        >
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
          <button className="self-end rounded-xl bg-[var(--control-strong)] px-5 py-3 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">
            Filtern
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
          <span>{obstacles.length} Hindernisse / obstacle-spezifische Übungen</span>
          {(query || riskLevel || archived) ? (
            <Link className="font-black underline underline-offset-4" href="/obstacles">Filter zurücksetzen</Link>
          ) : null}
        </div>

        {obstacles.length ? (
          <section className="grid gap-4 xl:grid-cols-2">
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
    </AppShell>
  );
}

function ObstacleCard({ obstacle }: { readonly obstacle: ObstacleCatalogItem }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="min-h-44 bg-[var(--surface-subtle)]">
          {obstacle.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${obstacle.name} · Hindernisvorschau`} className="h-full w-full object-contain" loading="lazy" src={obstacle.imageUrl} />
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

          <dl className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <Data label="Stationskapazität" value={String(obstacle.stationCapacity)} />
            <Data label="Freizone" value={`${obstacle.clearZoneMetres.toFixed(1)} m`} />
            <Data label="Mindestalter" value={obstacle.minAge == null ? "–" : `ab ${obstacle.minAge}`} />
            <Data label="Club-Maße" value={dimensionLabel(obstacle)} />
          </dl>

          {obstacle.equipment.length ? (
            <div className="flex flex-wrap gap-1.5">
              {obstacle.equipment.map((item) => <Badge key={item}>{item}</Badge>)}
            </div>
          ) : null}

          <section className="rounded-xl bg-[var(--surface-subtle)] p-3">
            <h3 className="text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)]">Aufbau</h3>
            <p className="mt-1 text-sm leading-6">{obstacle.equipmentConfiguration}</p>
          </section>

          <details className="rounded-xl border border-[var(--border)] p-3">
            <summary className="cursor-pointer text-sm font-black">Ablauf, Voraussetzung & Regression</summary>
            <div className="mt-3 space-y-3 text-sm leading-6">
              <Guidance label="Voraussetzung" value={obstacle.prerequisites} />
              <Guidance label="Annäherung" value={obstacle.approach} />
              <Guidance label="Ausführung" value={obstacle.execution} />
              <Guidance label="Ausstieg / Reset" value={obstacle.exitReset} />
              <Guidance label="Fallback" value={obstacle.fallbackExercise} />
            </div>
          </details>

          <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
            <Link className="rounded-lg bg-[var(--control-strong)] px-3 py-2 text-xs font-black text-[var(--control-strong-foreground)]" href={`/exercises/${obstacle.exerciseId}`}>
              Übung öffnen
            </Link>
            <Link className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-black" href={`/exercises/${obstacle.exerciseId}/edit`}>
              Hindernis bearbeiten
            </Link>
          </div>
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
