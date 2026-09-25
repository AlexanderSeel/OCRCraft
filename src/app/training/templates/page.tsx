import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OverviewLayout } from "@/components/overview-layout";
import { CatalogFilterPanel } from "@/components/catalog/catalog-filter-panel";
import { CatalogPageSize } from "@/components/catalog/catalog-filter-panel";
import { CatalogPagination, CatalogResultCount } from "@/components/catalog/catalog-controls";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/card";
import { ConfirmPopoverForm } from "@/components/ui/confirm-popover-form";
import {
  TRAINING_TEMPLATES,
  TRAINING_TEMPLATE_FOCUS_KEYS,
  trainingTemplateAudienceLabel,
  trainingTemplateFocusLabel,
  type TrainingTemplateFocus,
} from "@/domain/training/training-template-catalog";
import type { Audience } from "@/domain/training/model";
import { listClubTrainingTemplates } from "@/server/training/saved-training-template-service";
import { archiveClubTrainingTemplateAction, instantiateClubTrainingTemplateAction, updateClubTrainingTemplateAction } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{ audience?: string; focus?: string; saved?: string; error?: string; page?: string; size?: string }>;
}

const audiences: readonly Audience[] = ["adults", "kids", "youth"];

export default async function TrainingTemplatesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const audience = audiences.includes(params.audience as Audience) ? params.audience as Audience : "";
  const focus = TRAINING_TEMPLATE_FOCUS_KEYS.includes(params.focus as TrainingTemplateFocus)
    ? params.focus as TrainingTemplateFocus
    : "";
  const filteredTemplates = TRAINING_TEMPLATES.filter((item) =>
    (!audience || item.audience === audience) && (!focus || item.focus === focus)
  );
  const requestedSize = Number(params.size ?? "12");
  const pageSize = [6, 12, 24].includes(requestedSize) ? requestedSize : 12;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const templates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize);
  const clubTemplates = await listClubTrainingTemplates(false, 100);

  return (
    <AppShell
      title="Trainingsvorlagen"
      subtitle="Versionierte OCRCraft-Vorlagen mit nachvollziehbarer Strukturreferenz. Inhalte bleiben frei anpassbar und durchlaufen weiterhin alle Sicherheitsregeln."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/training">
            Training
          </Link>
          <Link className="rounded-xl bg-[var(--control-strong)] px-4 py-2.5 text-sm font-black text-[var(--control-strong-foreground)]" href="/quick-create">
            Ohne Vorlage starten
          </Link>
          <Link className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-black text-[var(--accent-foreground)]" href="/training/builder?mode=ai">
            Neue Vorlage mit AI planen
          </Link>
        </div>
      )}
    >
      <OverviewLayout storageKey="ocrcraft-template-view"><div className="space-y-6">
        {params.saved === "archived" ? (
          <Alert tone="success">
            Vereinsvorlage wurde archiviert.
          </Alert>
        ) : null}
        {params.saved === "edited" ? <Alert tone="success">Vereinsvorlage wurde aktualisiert.</Alert> : null}
        {params.error ? (
          <Alert tone="danger">
            {params.error === "use"
              ? "Vereinsvorlage konnte nicht verwendet werden. Prüfe, ob alle referenzierten Übungen noch aktiv sind."
              : "Vereinsvorlage konnte nicht archiviert werden."}
          </Alert>
        ) : null}
        {params.error === "edit" ? <Alert tone="danger">Vereinsvorlage konnte nicht aktualisiert werden. Prüfe Name und Beschreibung.</Alert> : null}

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Vereinsvorlagen</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Konkrete Snapshots aus bereits geplanten Trainings. Beim Verwenden entsteht ein neuer Entwurf; die Vorlage selbst bleibt unverändert.
              </p>
            </div>
            <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-xs font-black">{clubTemplates.length} gespeichert</span>
          </div>
          {clubTemplates.length ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {clubTemplates.map((item) => (
                <Card as="article" className="catalog-card min-w-0 flex flex-col rounded-xl bg-[var(--surface-subtle)] p-4" key={item.id}>
                  <div className="flex flex-wrap gap-2 text-xs font-black text-[var(--muted)]">
                    <span>{item.totalDurationMinutes} Min.</span>
                    <span>· {item.itemCount} Übungen</span>
                    <span>· {item.organizationMode === "team" ? `Team ${item.teamSize ?? 2}` : "Solo/Rotation"}</span>
                  </div>
                  <h3 className="mt-2 text-base font-black">{item.name}</h3>
                  {item.description ? <p className="view-secondary mt-2 text-sm leading-5 text-[var(--muted)]">{item.description}</p> : null}
                  <div className="view-detail mt-3 text-xs text-[var(--muted)]">
                    {item.sourceTrainingTitle ? <>Quelle: <strong className="text-[var(--foreground)]">{item.sourceTrainingTitle}</strong> · </> : null}
                    {item.createdBy ? `${item.createdBy} · ` : ""}{formatTemplateDate(item.createdAt)}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <form action={instantiateClubTrainingTemplateAction} className="flex-1">
                      <input name="templateId" type="hidden" value={item.id} />
                      <button className="min-h-10 w-full rounded-lg bg-[var(--control-strong)] px-3 text-xs font-black text-[var(--control-strong-foreground)]" type="submit">
                        Als Training bearbeiten
                      </button>
                    </form>
                    <ConfirmPopoverForm action={archiveClubTrainingTemplateAction} description={`Die Vorlage „${item.name}“ wird aus der aktiven Vorlagenauswahl entfernt.`} title="Vorlage archivieren?" triggerLabel="Archivieren"><input name="templateId" type="hidden" value={item.id} /></ConfirmPopoverForm>
                    <details className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                      <summary className="cursor-pointer text-xs font-black">Vorlagenname / Beschreibung bearbeiten</summary>
                      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Für Änderungen an Phasen oder Übungen öffnest du die Vorlage als Training und speicherst danach eine neue, geprüfte Vorlage.</p>
                      <form action={updateClubTrainingTemplateAction} className="mt-3 grid gap-2">
                        <input name="templateId" type="hidden" value={item.id} />
                        <label className="grid gap-1 text-xs font-bold">Name<input className="min-h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-sm font-normal" defaultValue={item.name} maxLength={120} minLength={2} name="name" required /></label>
                        <label className="grid gap-1 text-xs font-bold">Beschreibung<textarea className="min-h-20 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm font-normal" defaultValue={item.description ?? ""} maxLength={1000} name="description" /></label>
                        <button className="min-h-10 rounded-md bg-[var(--brand)] px-3 text-xs font-black text-[var(--brand-foreground)]" type="submit">Metadaten speichern</button>
                      </form>
                    </details>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
              <EmptyState title="Noch keine Vereinsvorlagen">
              Noch keine Vereinsvorlage gespeichert. Erzeuge zuerst ein Training im Builder oder per AI und speichere es anschließend auf der Trainingsdetailseite als Vorlage.
            </EmptyState>
          )}
        </Card>

        <div className="grid gap-4 lg:grid-cols-[max-content_minmax(0,1fr)] lg:items-start">
          <CatalogFilterPanel hasFilters={Boolean(audience || focus || page !== 1 || pageSize !== 12)} resetHref="/training/templates" title="Vorlagenfilter">
            <label className="grid gap-2 text-sm font-bold">
              Zielgruppe
              <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={audience} name="audience">
                <option value="">Alle</option>
                {audiences.map((value) => <option key={value} value={value}>{trainingTemplateAudienceLabel(value)}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Schwerpunkt
              <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={focus} name="focus">
                <option value="">Alle</option>
                {TRAINING_TEMPLATE_FOCUS_KEYS.map((value) => <option key={value} value={value}>{trainingTemplateFocusLabel(value)}</option>)}
              </select>
            </label>
            <CatalogPageSize options={[6, 12, 24]} value={pageSize} />
          </CatalogFilterPanel>

          <div className="min-w-0 space-y-6">
          <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black"><CatalogResultCount from={filteredTemplates.length ? (page - 1) * pageSize + 1 : 0} label={filteredTemplates.length === 1 ? "Vorlage" : "Vorlagen"} to={Math.min(page * pageSize, filteredTemplates.length)} total={filteredTemplates.length} /></h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Jede Vorlage definiert Planungsparameter; konkrete Übungen kommen erst beim Erzeugen aus dem freigegebenen Katalog.</p>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-black">{templates.length} versionierte Startvorlagen</span>
          </section>

          <section className="catalog-results grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {templates.map((item) => (
            <Card as="article" className="catalog-card min-w-0 flex flex-col p-5" key={item.key}>
              <div className="flex flex-wrap gap-2 text-xs font-black">
                <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1">{trainingTemplateAudienceLabel(item.audience)}</span>
                <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1">{trainingTemplateFocusLabel(item.focus)}</span>
                <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1">{item.durationMinutes} Min.</span>
              </div>
              <h2 className="mt-4 text-lg font-black">{item.titleDe}</h2>
              <p className="view-summary mt-2 text-sm leading-6 text-[var(--muted)]">{item.descriptionDe}</p>

              <dl className="view-detail mt-4 grid gap-2 text-xs">
                <Phase label="Aufwärmen" value={item.structureDe.warmup} />
                <Phase label="Hauptteil" value={item.structureDe.main} />
                <Phase label="Cooldown" value={item.structureDe.cooldown} />
              </dl>

              <div className="view-detail mt-4 text-xs text-[var(--muted)]">
                <strong className="text-[var(--foreground)]">Materialhinweise:</strong> {item.materialHintsDe.join(", ")}
              </div>
              <div className="view-detail mt-3 text-xs text-[var(--muted)]">
                Strukturreferenz: <a className="font-bold underline underline-offset-2" href={item.provenance.referenceUrl} rel="noreferrer" target="_blank">{item.provenance.referenceProvider}</a>.
                {" "}Die Vorlage selbst ist OCRCraft-Eigeninhalt; keine externen Texte oder Bilder werden übernommen.
              </div>

              <div className="mt-auto pt-5">
                <Link
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--control-strong)] px-4 text-sm font-black text-[var(--control-strong-foreground)]"
                  href={"/quick-create?template=" + encodeURIComponent(item.key)}
                >
                  Vorlage in Quick Create öffnen
                </Link>
              </div>
            </Card>
          ))}
          </section>
          <CatalogPagination href={(nextPage) => pageHref(nextPage, audience, focus, pageSize)} label="Vorlagen" page={page} totalPages={Math.max(1, Math.ceil(filteredTemplates.length / pageSize))} />
          </div>
        </div>
      </div></OverviewLayout>
    </AppShell>
  );
}

function pageHref(page: number, audience: string, focus: string, size: number): string {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (audience) params.set("audience", audience);
  if (focus) params.set("focus", focus);
  return "/training/templates?" + params.toString();
}

function formatTemplateDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function Phase({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
      <dt className="font-black">{label}</dt>
      <dd className="mt-1 leading-5 text-[var(--muted)]">{value}</dd>
    </div>
  );
}
