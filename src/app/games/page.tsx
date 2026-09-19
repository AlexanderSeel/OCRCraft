import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OverviewLayout } from "@/components/overview-layout";
import { ExerciseImagePreview } from "@/components/exercises/exercise-image-preview";
import { CatalogPagination, CatalogResultCount } from "@/components/catalog/catalog-controls";
import { CatalogFilterPanel, CatalogPageSize } from "@/components/catalog/catalog-filter-panel";
import { EmptyState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/card";
import { exerciseCategoryLabels, type ExerciseCategory } from "@/domain/exercise/model";
import { countExercises, listExercises } from "@/server/exercises/exercise-repository";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{ q?: string; status?: string; page?: string; size?: string }>;
}

export default async function GamesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const archived = params.status === "archived";
  const requestedSize = Number.parseInt(params.size ?? "40", 10) || 40;
  const pageSize = [20, 40, 80].includes(requestedSize) ? requestedSize : 40;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const [total, games] = await Promise.all([
    countExercises({ query, archived, exerciseType: "game" }),
    listExercises({
      query,
      archived,
      exerciseType: "game",
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AppShell
      title="Spiele"
      subtitle="Spielerische Trainingsformen als vollwertige Katalogeinträge – mit denselben Sicherheits-, Medien-, Muskel-, Equipment- und Coachingdaten wie Übungen."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/exercises">Übungen</Link>
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/training">Training</Link>
          <Link className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-black text-[var(--accent-foreground)]" href="/games/new">+ Neues Spiel</Link>
        </div>
      )}
    >
      <OverviewLayout storageKey="ocrcraft-games-view"><div className="space-y-6">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[max-content_minmax(0,1fr)] lg:items-start">
        <CatalogFilterPanel hasFilters={Boolean(query || archived || page !== 1 || pageSize !== 40)} resetHref="/games" title="Spielfilter">
            <label className="grid gap-1 text-sm font-bold">
              Suchen
              <input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={query} name="q" placeholder="z. B. Team, Reaktion, OCR …" />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Status
              <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={archived ? "archived" : "active"} name="status">
                <option value="active">Aktiv</option>
                <option value="archived">Archiviert</option>
              </select>
            </label>
            <CatalogPageSize value={pageSize} />
        </CatalogFilterPanel>

        <div className="min-w-0 space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black"><CatalogResultCount from={(page - 1) * pageSize + 1} label={total === 1 ? "Spiel" : "Spiele"} to={Math.min(page * pageSize, total)} total={total} /></h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Lokale und AI-Planung sehen Spiele im selben Kandidatenpool und wenden dieselben Alters-, Risiko-, Equipment-, Orts- und Vereinsregeln an.</p>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-black">Katalogtyp: game</span>
        </section>

        {games.length ? (
          <section className="catalog-results grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {games.map((game, index) => (
              <Card as="article" className="catalog-card min-w-0 flex flex-col overflow-hidden" key={game.id}>
                {game.imageUrl ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-[var(--surface-subtle)]">
                    <ExerciseImagePreview alt={`Spielillustration: ${game.name}`} priority={index === 0} src={game.imageUrl} />
                  </div>
                ) : (
                  <div className="grid aspect-[16/9] place-items-center bg-[var(--surface-subtle)] text-sm font-bold text-[var(--muted)]">Noch kein Bild verfügbar</div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{categoryLabel(game.category)}</div>
                      <h2 className="mt-1 text-lg font-black">{game.name}</h2>
                    </div>
                    <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-black">{game.riskLevel}</span>
                  </div>
                  <p className="view-summary mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{game.summary || "Noch keine Kurzbeschreibung hinterlegt."}</p>
                  <div className="view-secondary mt-3 flex flex-wrap gap-2 text-xs font-bold">
                    {game.minAge ? <span className="rounded-full border border-[var(--border)] px-2.5 py-1">ab {game.minAge}</span> : null}
                    {game.phase ? <span className="rounded-full border border-[var(--border)] px-2.5 py-1">{game.phase}</span> : null}
                    {game.equipment.slice(0, 2).map((item) => <span className="rounded-full border border-[var(--border)] px-2.5 py-1" key={item}>{item}</span>)}
                  </div>
                  <div className="view-actions mt-auto flex flex-wrap gap-2 pt-4">
                    <Link className="rounded-xl bg-[var(--control-strong)] px-4 py-2.5 text-sm font-black text-[var(--control-strong-foreground)]" href={`/exercises/${game.id}`}>Details</Link>
                    <Link className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-black" href={`/exercises/${game.id}/edit`}>{archived ? "Ansehen / Wiederherstellen" : "Bearbeiten"}</Link>
                  </div>
                </div>
              </Card>
            ))}
          </section>
        ) : (
          <EmptyState title="Keine Spiele gefunden">
            Passe den Filter an oder lege ein neues Spiel an. Es erhält anschließend denselben vollständigen Editor wie jede Übung.
          </EmptyState>
        )}

        <CatalogPagination href={(nextPage) => pageHref(nextPage, query, archived, pageSize)} label="Spiele" page={page} totalPages={totalPages} />
        </div>
        </div>
      </div></OverviewLayout>
    </AppShell>
  );
}

function categoryLabel(value: string): string {
  return exerciseCategoryLabels[value as ExerciseCategory] ?? value;
}

function pageHref(page: number, query: string, archived: boolean, size: number): string {
  const params = new URLSearchParams({ page: String(page), size: String(size), status: archived ? "archived" : "active" });
  if (query) params.set("q", query);
  return "/games?" + params.toString();
}
