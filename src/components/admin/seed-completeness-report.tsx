import Link from "next/link";
import type { SeedCompletenessReport } from "@/server/exercises/seed-completeness-service";
import { Disclosure } from "@/components/ui/disclosure";

interface SeedCompletenessReportProps {
  readonly report: SeedCompletenessReport;
}

export function SeedCompletenessReportView({ report }: SeedCompletenessReportProps) {
  return (
    <section aria-labelledby="seed-completeness-heading" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Übungsdatenbank</div>
          <h2 className="mt-1 text-xl font-black" id="seed-completeness-heading">Vollständigkeit der Übungsdatenbank</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Der Seed-Bestand und der gesamte Katalog werden getrennt geprüft. Der Wert bewertet strukturierte Grundfelder in beiden Sprachen, nicht die fachliche Qualität der Formulierungen.
          </p>
        </div>
        <div aria-label={`${report.completenessPercent} Prozent der versionierten Seeds erfüllen die Grundfelder`} className="min-w-40 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3" role="group">
          <div className="text-2xl font-black">{report.completenessPercent}%</div>
          <div className="text-xs font-semibold text-[var(--muted)]">{report.completeExercises} von {report.totalExercises} Seeds vollständig</div>
          <div className="mt-1 text-xs font-semibold text-[var(--muted)]">Katalog: {report.completeCatalogExercises} von {report.totalCatalogExercises}</div>
          <div className="mt-1 text-xs font-semibold text-[var(--muted)]">Fachreview: {report.reviewedExercises} bestanden{report.qualityReviewOpen > 0 ? ` · ${report.qualityReviewOpen} offen` : ""}</div>
          <div aria-valuemax={100} aria-valuemin={0} aria-valuenow={report.completenessPercent} className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border)]" role="progressbar">
            <div className="h-full rounded-full bg-[var(--success-foreground)]" style={{ width: `${report.completenessPercent}%` }} />
          </div>
        </div>
      </div>

      {report.qualityReviewOpen > 0 ? (
        <p className="mt-4 rounded-xl border border-[var(--warning)] bg-[var(--warning-bg)] p-3 text-sm font-semibold text-[var(--warning)]">
          {report.qualityReviewOpen} versionierte Seeds erfüllen das fachliche Review-Gate noch nicht vollständig.
        </p>
      ) : null}

      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><h3 className="font-black">Strukturierte DE/EN-Felder</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Pro Seed werden beide Sprachdatensätze für Details, drei Ausführungsschritte, Coaching-Cues sowie Fehlerkorrekturen geprüft.</p></div>
          <span className="text-xs font-black text-[var(--muted)]">{report.structuredTranslations.expectedLocalizedRecords} Sprachdatensätze</span>
        </div>
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
          <StructuredMetric label="Details" value={report.structuredTranslations.completeDetailRecords} total={report.structuredTranslations.expectedLocalizedRecords} />
          <StructuredMetric label="Ausführung" value={report.structuredTranslations.completeExecutionRecords} total={report.structuredTranslations.expectedLocalizedRecords} />
          <StructuredMetric label="Coaching" value={report.structuredTranslations.completeCoachingRecords} total={report.structuredTranslations.expectedLocalizedRecords} />
          <StructuredMetric label="Korrekturen" value={report.structuredTranslations.completeCorrectionRecords} total={report.structuredTranslations.expectedLocalizedRecords} />
        </div>
      </div>

      {report.totalExercises === 0 ? (
        <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--muted)]">
          Es sind noch keine versionierten Seeds in der Datenbank vorhanden.
        </p>
      ) : report.incompleteExercises.length === 0 ? (
        <p className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-semibold text-[var(--success-foreground)]">
          Alle versionierten Seeds erfüllen die geprüften Grundfelder.
        </p>
      ) : (
        <Disclosure
          className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]"
          summaryClassName="min-h-11 px-4 py-3 text-sm font-bold"
          summary={`${report.incompleteExercises.length} Übungen mit fehlenden Grundfeldern anzeigen`}
        >
          <ul className="space-y-2 border-t border-[var(--border)] p-3">
            {report.incompleteExercises.map((exercise) => (
              <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3" key={exercise.exerciseId}>
                <Link className="font-bold underline decoration-[var(--border)] underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]" href={`/exercises/${encodeURIComponent(exercise.exerciseId)}/edit`}>
                  {exercise.nameDe || exercise.seedKey}
                </Link>
                <span className="ml-2 text-xs text-[var(--muted)]">{exercise.nameEn} · {exercise.category}</span>
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">Fehlt: {exercise.missingFields.join(", ")}</p>
              </li>
            ))}
          </ul>
        </Disclosure>
      )}
    </section>
  );
}

function StructuredMetric({ label, value, total }: { readonly label: string; readonly value: number; readonly total: number }) {
  const complete = value === total;
  return <div className={`rounded-lg border p-2 ${complete ? "border-[var(--success-border)] bg-[var(--success-bg)]" : "border-[var(--warning)] bg-[var(--warning-bg)]"}`}><div className="font-black">{label}</div><div className="mt-1 font-semibold">{value} / {total}</div></div>;
}
