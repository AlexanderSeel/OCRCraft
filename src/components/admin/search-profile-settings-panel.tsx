import type { SearchProfile } from "@/server/search/search-profile-repository";
import { ConfirmPopoverForm } from "@/components/ui/confirm-popover-form";
import { buttonClass } from "@/components/ui/form";

type FormAction = (formData: FormData) => Promise<void>;

interface SearchProfileSettingsPanelProps {
  readonly profiles: readonly SearchProfile[];
  readonly saveAction: FormAction;
  readonly activateAction: FormAction;
  readonly deleteAction: FormAction;
  readonly saved?: string;
  readonly error?: string;
}

const fields = [
  ["exact", "Exakter Name", "Exakte Übungsnamen."],
  ["prefix", "Namenspräfix", "Name beginnt mit Suchbegriff."],
  ["alias", "Aliase", "Trainerbegriffe und alternative Namen."],
  ["summary", "Kurzbeschreibung", "Zusammenfassung der Übung."],
  ["taxonomy", "Ziele & Taxonomie", "Kategorie, Trainingsziel, Tags und Bewegungsmuster."],
  ["bodyRegions", "Körperregionen", "Muskel- und Körperregionsbegriffe."],
  ["equipment", "Equipment", "Benötigtes Material."],
  ["instructions", "Instruktionen", "Ausführung, Coaching und Sicherheitsdetails im Volltext."],
] as const;

export function SearchProfileSettingsPanel({
  profiles,
  saveAction,
  activateAction,
  deleteAction,
  saved,
  error,
}: SearchProfileSettingsPanelProps) {
  return (
    <section id="search-profile-settings" className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Suche</div>
          <h2 className="mt-1 text-xl font-black">Suchprofile & Feldgewichte</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Das aktive Profil ergänzt DuckDB-BM25 um strukturierte Ranking-Booste. Hohe Werte priorisieren Treffer in dem jeweiligen Feld; 0 deaktiviert nur den zusätzlichen Boost, nicht die grundsätzliche Volltextauffindbarkeit.
          </p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-black">
          {profiles.find((profile) => profile.isActive)?.name ?? "Ausgewogen"}
        </span>
      </div>

      {saved ? <p aria-live="polite" className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success-foreground)]">Suchprofil gespeichert.</p> : null}
      {error ? <p aria-live="assertive" className="mt-4 rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">Suchprofil konnte nicht geändert werden. Prüfe Name, Gewichte und Berechtigung.</p> : null}

      <div className="mt-5 grid gap-4">
        {profiles.map((profile) => (
          <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" key={profile.id}>
            <form action={saveAction}>
              <input name="id" type="hidden" value={profile.id} />
              <div className="flex flex-wrap items-center gap-3">
                <label className="min-w-56 flex-1 text-sm font-black">
                  Profilname
                  <input className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={profile.name} maxLength={80} name="name" required />
                </label>
                {profile.isActive ? <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-black">Aktiv</span> : null}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {fields.map(([name,label,description]) => (
                  <WeightField description={description} key={name} label={label} name={name} value={profile.weights[name]} />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button className={buttonClass("secondary", "min-h-10 px-3 text-xs")} type="submit">Änderungen speichern</button>
              </div>
            </form>
            {!profile.isActive ? (
              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-[var(--border)] pt-3">
                <form action={activateAction}>
                  <input name="id" type="hidden" value={profile.id} />
                  <button className={buttonClass("primary", "min-h-10 px-3 text-xs")} type="submit">Profil aktivieren</button>
                </form>
                <ConfirmPopoverForm action={deleteAction} description={`Das Suchprofil „${profile.name}“ wird dauerhaft gelöscht.`} title="Suchprofil löschen?" triggerLabel="Löschen"><input name="id" type="hidden" value={profile.id} /></ConfirmPopoverForm>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <form action={saveAction} className="mt-5 rounded-xl border border-dashed border-[var(--border)] p-4">
        <h3 className="text-sm font-black">Neues Suchprofil</h3>
        <label className="mt-3 block text-sm font-bold">
          Profilname
          <input className="mt-1 h-10 w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" maxLength={80} name="name" placeholder="z. B. OCR-Technik" required />
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map(([name,label,description], index) => (
            <WeightField description={description} key={name} label={label} name={name} value={[100,75,50,20,25,25,20,10][index]} />
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button className={buttonClass("secondary", "min-h-10 px-4 text-xs")} type="submit">Profil anlegen</button>
        </div>
      </form>
    </section>
  );
}

function WeightField({
  name,
  label,
  description,
  value,
}: {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly value: number;
}) {
  return (
    <label className="grid gap-1 text-xs font-bold">
      {label}
      <input className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 font-normal" defaultValue={value} max={500} min={0} name={name} required type="number" />
      <span className="font-normal leading-4 text-[var(--muted)]">{description}</span>
    </label>
  );
}
