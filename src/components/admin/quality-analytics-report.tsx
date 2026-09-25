import type { QualityAnalyticsReport } from "@/server/quality/quality-analytics-service";

export function QualityAnalyticsReportView({ report }: { readonly report: QualityAnalyticsReport }) {
  const zeroHits = report.zeroScenarios.filter((item) => item.count === 0);
  return (
    <section aria-labelledby="quality-analytics-heading" className="admin-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="ui-kicker">Qualitätsanalyse</div>
          <h2 className="mt-1 text-xl font-black" id="quality-analytics-heading">Nutzung, Coverage und KI-Ersatz</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Repository-basierte Signale aus aktiven Übungen, gespeicherten Trainings und Medienreviews. Nulltreffer werden mit den tatsächlich angewendeten Zielgruppen-/Ortsfiltern erklärt.
          </p>
        </div>
        <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-black">{report.activeExercises} aktive Übungen</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="In Trainings genutzt" value={`${report.usedExercises} / ${report.activeExercises}`} />
        <Metric label="Noch ungenutzt" value={String(report.unusedExercises)} warning={report.unusedExercises > 0} />
        <Metric label="Primärregion fehlt" value={String(report.missingPrimaryBodyRegion)} warning={report.missingPrimaryBodyRegion > 0} />
        <Metric label="OCR/Hindernis-Coverage" value={`${report.obstacleCoveragePercent}%`} warning={report.obstacleCoveragePercent < 100} />
        <Metric label="Gespeichertes Laufvolumen" value={`${report.routeDistanceKilometres} km`} />
        <Metric label="Running-Items" value={String(report.runningTrainingItems)} />
        <Metric label="Katalog vollständig" value={`${report.completeness.completePercent}%`} warning={report.completeness.incompleteCatalogExercises > 0} />
        <Metric label="Bildersatz offen" value={String(report.mediaReplacement.totalCandidates)} warning={report.mediaReplacement.totalCandidates > 0} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <article className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <h3 className="font-black">Wiederholungswarnungen</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Übungen mit mindestens drei Einsätzen in den letzten sechs aktiven Trainings.</p>
          {report.recentRepeatedExercises.length ? (
            <ul className="mt-3 space-y-1 text-sm">
              {report.recentRepeatedExercises.slice(0, 8).map((item) => <li key={item.exerciseId}>{item.name} · <strong>{item.useCount}×</strong></li>)}
            </ul>
          ) : <p className="mt-3 text-sm font-bold text-[var(--success-foreground)]">Keine auffällige Wiederholung.</p>}
        </article>

        <article className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <h3 className="font-black">Nulltreffer / Filter</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Standard-Szenarien prüfen Zielgruppe, Mindestalter und Ort direkt gegen den freigegebenen Kandidatenpool.</p>
          <ul className="mt-3 space-y-1 text-sm">
            {report.zeroScenarios.map((item) => (
              <li className={item.count === 0 ? "font-bold text-[var(--warning)]" : ""} key={`${item.audience}-${item.location}`}>
                {audienceLabel(item.audience)} · {locationLabel(item.location)} · ab {item.minAge}: {item.count}
              </li>
            ))}
          </ul>
          {zeroHits.length ? <p className="mt-2 text-xs text-[var(--warning)]">{zeroHits.map((item) => item.explanation).join(" ")}</p> : null}
        </article>

        <article className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <h3 className="font-black">KI-/Medienersatz</h3>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Data label="Komplett fehlend" value={report.mediaReplacement.reasons.missing} />
            <Data label="Rechte blockiert" value={report.mediaReplacement.reasons.rights_blocked} />
            <Data label="Generierung fehlgeschlagen" value={report.mediaReplacement.reasons.generation_failed} />
            <Data label="Sonst unbrauchbar" value={report.mediaReplacement.reasons.unusable} />
            <Data label="Job läuft" value={report.mediaReplacement.reasons.job_running} />
            <Data label="Medienreview offen" value={report.mediaReplacement.pendingMediaReviews} />
            <Data label="Medien freigegeben" value={report.mediaReplacement.approvedMedia} />
            <Data label="Kataloglücken" value={report.completeness.incompleteCatalogExercises} />
          </dl>
        </article>
      </div>
    </section>
  );
}

function Metric({ label, value, warning = false }: { readonly label: string; readonly value: string; readonly warning?: boolean }) {
  return <div className={`rounded-lg border p-3 ${warning ? "border-[var(--warning)] bg-[var(--warning-bg)]" : "border-[var(--border)] bg-[var(--surface-subtle)]"}`}><div className="text-xs font-bold text-[var(--muted)]">{label}</div><div className="mt-1 text-xl font-black">{value}</div></div>;
}

function Data({ label, value }: { readonly label: string; readonly value: number }) {
  return <div><dt className="text-xs text-[var(--muted)]">{label}</dt><dd className="font-black">{value}</dd></div>;
}

function audienceLabel(value: string): string {
  if (value === "kids") return "Kids";
  if (value === "youth") return "Youth";
  return "Adults";
}

function locationLabel(value: string): string {
  if (value === "indoor") return "Indoor";
  if (value === "outdoor") return "Outdoor";
  return "Mixed";
}
