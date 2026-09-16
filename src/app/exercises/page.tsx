import { AppShell } from "@/components/app-shell";
import {
  getExerciseCategoryCounts,
  listExercises,
} from "@/server/exercises/exercise-repository";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  warmup: "Aufwärmen",
  mobility: "Mobilität",
  strength: "Kraft",
  core: "Core",
  running: "Laufen",
  "grip-rig": "Grip & Rig",
  "carry-lift": "Carries & Lifts",
  "ocr-skill": "OCR Skills",
  "balance-agility": "Balance & Agilität",
  throw: "Werfen",
  cooldown: "Cooldown",
};

interface PageProps {
  readonly searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category?.trim() || undefined;
  const [exercises, categoryCounts] = await Promise.all([
    listExercises({ query, category }),
    getExerciseCategoryCounts(),
  ]);
  const total = categoryCounts.reduce((sum, item) => sum + item.count, 0);
  const runningCount = categoryCounts.find((item) => item.category === "running")?.count ?? 0;

  return (
    <AppShell
      title="Übungsbibliothek"
      subtitle="Initialkatalog für Breitensport, OCR und Laufen – suchbar und später vollständig administrierbar."
    >
      <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Übungen gesamt" value={total} />
          <Metric label="Laufübungen" value={runningCount} />
          <Metric label="Kategorien" value={categoryCounts.length} />
        </section>

        <form className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4 sm:grid-cols-[1fr_240px_auto]" method="get">
          <label className="grid gap-1 text-sm font-bold">
            Suchen
            <input
              className="h-11 rounded-xl border border-[var(--border)] px-3 font-normal outline-none focus:border-[#4d75ff]"
              defaultValue={query}
              name="q"
              placeholder="z. B. Monkey Bars, Kniebeugen, Lauf ABC ..."
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Bereich
            <select
              className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 font-normal"
              defaultValue={category ?? ""}
              name="category"
            >
              <option value="">Alle Bereiche</option>
              {categoryCounts.map((item) => (
                <option key={item.category} value={item.category}>
                  {categoryLabels[item.category] ?? item.category} ({item.count})
                </option>
              ))}
            </select>
          </label>
          <button className="self-end rounded-xl bg-[var(--dark)] px-5 py-3 text-sm font-black text-white" type="submit">
            Filtern
          </button>
        </form>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => (
            <article className="rounded-2xl border border-[var(--border)] bg-white p-5" key={exercise.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {categoryLabels[exercise.category] ?? exercise.category}
                  </div>
                  <h2 className="mt-1 text-lg font-black">{exercise.name}</h2>
                </div>
                <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-bold">
                  {exercise.riskLevel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{exercise.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                {exercise.phase ? <span className="rounded-full border border-[var(--border)] px-2.5 py-1">{exercise.phase}</span> : null}
                {exercise.minAge ? <span className="rounded-full border border-[var(--border)] px-2.5 py-1">ab {exercise.minAge}</span> : null}
                {exercise.equipment.slice(0, 3).map((item) => (
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1" key={item}>{item}</span>
                ))}
              </div>
            </article>
          ))}
        </section>

        {exercises.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
            Keine Übung passt zu diesem Filter.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--muted)]">{label}</div>
    </div>
  );
}
