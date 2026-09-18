import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  TRAINING_TEMPLATES,
  TRAINING_TEMPLATE_FOCUS_KEYS,
  trainingTemplateAudienceLabel,
  trainingTemplateFocusLabel,
  type TrainingTemplateFocus,
} from "@/domain/training/training-template-catalog";
import type { Audience } from "@/domain/training/model";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{ audience?: string; focus?: string }>;
}

const audiences: readonly Audience[] = ["adults", "kids", "youth"];

export default async function TrainingTemplatesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const audience = audiences.includes(params.audience as Audience) ? params.audience as Audience : "";
  const focus = TRAINING_TEMPLATE_FOCUS_KEYS.includes(params.focus as TrainingTemplateFocus)
    ? params.focus as TrainingTemplateFocus
    : "";
  const templates = TRAINING_TEMPLATES.filter((item) =>
    (!audience || item.audience === audience) && (!focus || item.focus === focus)
  );

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
        </div>
      )}
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Zielgruppe
              <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={audience} form="template-filter" name="audience">
                <option value="">Alle</option>
                {audiences.map((value) => <option key={value} value={value}>{trainingTemplateAudienceLabel(value)}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Schwerpunkt
              <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={focus} form="template-filter" name="focus">
                <option value="">Alle</option>
                {TRAINING_TEMPLATE_FOCUS_KEYS.map((value) => <option key={value} value={value}>{trainingTemplateFocusLabel(value)}</option>)}
              </select>
            </label>
          </div>
          <form className="mt-4 flex justify-end gap-2" id="template-filter">
            <Link className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-black" href="/training/templates">Zurücksetzen</Link>
            <button className="rounded-lg bg-[var(--control-strong)] px-4 py-2 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">Filtern</button>
          </form>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">{templates.length} Vorlagen</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Jede Vorlage definiert Planungsparameter; konkrete Übungen kommen erst beim Erzeugen aus dem freigegebenen Katalog.</p>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-black">24 versionierte Startvorlagen</span>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {templates.map((item) => (
            <article className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]" key={item.key}>
              <div className="flex flex-wrap gap-2 text-xs font-black">
                <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1">{trainingTemplateAudienceLabel(item.audience)}</span>
                <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1">{trainingTemplateFocusLabel(item.focus)}</span>
                <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1">{item.durationMinutes} Min.</span>
              </div>
              <h2 className="mt-4 text-lg font-black">{item.titleDe}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.descriptionDe}</p>

              <dl className="mt-4 grid gap-2 text-xs">
                <Phase label="Aufwärmen" value={item.structureDe.warmup} />
                <Phase label="Hauptteil" value={item.structureDe.main} />
                <Phase label="Cooldown" value={item.structureDe.cooldown} />
              </dl>

              <div className="mt-4 text-xs text-[var(--muted)]">
                <strong className="text-[var(--foreground)]">Materialhinweise:</strong> {item.materialHintsDe.join(", ")}
              </div>
              <div className="mt-3 text-xs text-[var(--muted)]">
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
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function Phase({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
      <dt className="font-black">{label}</dt>
      <dd className="mt-1 leading-5 text-[var(--muted)]">{value}</dd>
    </div>
  );
}
