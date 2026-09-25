import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { Disclosure } from "@/components/ui/disclosure";
import { ConfirmPopoverForm } from "@/components/ui/confirm-popover-form";
import {
  TRAINER_QUALIFICATION_LABELS,
  TRAINER_QUALIFICATION_LEVELS,
} from "@/domain/training/trainer-qualification";
import {
  listYouthSafetyProfiles,
  type YouthSafetyProfile,
} from "@/server/groups/youth-safety-profile-repository";
import {
  listTrainingObstacleOptions,
  type TrainingObstacleOption,
} from "@/server/training/training-draft-repository";
import {
  createYouthSafetyProfileAction,
  setYouthSafetyProfileArchivedAction,
  updateYouthSafetyProfileAction,
} from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{ archived?: string; saved?: string; error?: string }>;
}

export default async function SafetyProfilesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const archived = params.archived === "1";
  const [allProfiles, obstacles] = await Promise.all([
    listYouthSafetyProfiles(archived),
    listTrainingObstacleOptions("de"),
  ]);
  const profiles = archived ? allProfiles.filter((item) => item.archived) : allProfiles;

  return (
    <AppShell
      title="Kids & Youth · Schutzprofile"
      subtitle="Wiederverwendbare Alters-, Risiko-, Impact-, Aufsichts- und Hindernisgrenzen für Vereinsgruppen."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href="/groups">
            Gruppen
          </Link>
          <Link className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black" href={archived ? "/groups/safety-profiles" : "/groups/safety-profiles?archived=1"}>
            {archived ? "Aktive Profile" : "Archiv"}
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {params.saved ? <Message success>Schutzprofil wurde gespeichert.</Message> : null}
        {params.error ? (
          <Message>
            {params.error === "linked"
              ? "Das Profil kann nicht archiviert werden, solange es einer aktiven Gruppe zugeordnet ist."
              : "Schutzprofil konnte nicht gespeichert werden. Prüfe Altersbereich und Hindernisauswahl."}
          </Message>
        ) : null}

        {!archived ? (
          <Disclosure
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
            summary="+ Neues Schutzprofil"
            summaryClassName="px-5 py-4 font-black"
          >
            <form action={createYouthSafetyProfileAction} className="border-t border-[var(--border)] p-5">
              <ProfileFields obstacles={obstacles} />
              <div className="mt-4 flex justify-end">
                <button className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)]" type="submit">
                  Schutzprofil anlegen
                </button>
              </div>
            </form>
          </Disclosure>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-2">
          {profiles.map((profile) => (
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]" key={profile.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">{profile.audience === "kids" ? "Kinder" : "Jugend"}</div>
                  <h2 className="mt-1 text-lg font-black">{profile.name}</h2>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-black">
                  {profile.archived ? "Archiviert" : "Aktiv"}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <Metric label="Alter" value={`${profile.minAge}–${profile.maxAge}`} />
                <Metric label="Max. Risiko" value={riskLabel(profile.maximumRiskLevel)} />
                <Metric label="Max. Impact" value={impactLabel(profile.maximumImpactLevel)} />
                <Metric label="Aufsicht" value={supervisionLabel(profile.supervisionRequirement)} />
                <Metric label="Mindestqualifikation" value={TRAINER_QUALIFICATION_LABELS[profile.minimumTrainerQualification]} />
              </dl>
              <div className="mt-3 rounded-xl bg-[var(--surface-subtle)] p-3 text-sm">
                <strong>{profile.restrictions.length} gesperrte Hindernisse</strong>
                {profile.restrictions.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {profile.restrictions.map((item) => <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-bold" key={item.exerciseId}>{item.exerciseName}</span>)}
                  </div>
                ) : <p className="mt-1 text-xs text-[var(--muted)]">Keine zusätzlichen Hindernissperren.</p>}
              </div>
              {profile.notes ? <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{profile.notes}</p> : null}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                {!profile.archived ? (
                  <Disclosure className="min-w-[280px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]" summary="Bearbeiten" summaryClassName="px-4 py-3 text-sm font-black">
                    <form action={updateYouthSafetyProfileAction} className="border-t border-[var(--border)] p-4">
                      <input name="id" type="hidden" value={profile.id} />
                      <ProfileFields obstacles={obstacles} profile={profile} />
                      <div className="mt-4 flex justify-end">
                        <button className="rounded-lg bg-[var(--control-strong)] px-4 py-2 text-xs font-black text-[var(--control-strong-foreground)]" type="submit">Änderungen speichern</button>
                      </div>
                    </form>
                  </Disclosure>
                ) : null}
                <ConfirmPopoverForm action={setYouthSafetyProfileArchivedAction} description={profile.archived ? "Das Sicherheitsprofil wird wieder für die aktive Gruppenplanung verfügbar." : "Das Sicherheitsprofil wird archiviert; bestehende Trainings bleiben erhalten."} title={profile.archived ? "Sicherheitsprofil wiederherstellen?" : "Sicherheitsprofil archivieren?"} triggerClassName="min-h-11 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-black" triggerLabel={profile.archived ? "Wiederherstellen" : "Archivieren"}>
                  <input name="id" type="hidden" value={profile.id} />
                  <input name="archived" type="hidden" value={profile.archived ? "false" : "true"} />
                </ConfirmPopoverForm>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function ProfileFields({
  profile,
  obstacles,
}: {
  readonly profile?: YouthSafetyProfile;
  readonly obstacles: readonly TrainingObstacleOption[];
}) {
  const restricted = new Set(profile?.restrictions.map((item) => item.exerciseId) ?? []);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1.5 text-sm font-bold md:col-span-2">
          Name
          <input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={profile?.name ?? ""} maxLength={120} name="name" required />
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Zielgruppe
          <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={profile?.audience ?? "kids"} name="audience">
            <option value="kids">Kinder</option>
            <option value="youth">Jugend</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Aufsicht
          <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={profile?.supervisionRequirement ?? "direct"} name="supervisionRequirement">
            <option value="normal">Normale Aufsicht</option>
            <option value="increased">Erhöhte Aufsicht</option>
            <option value="direct">Direkte Traineraufsicht</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Mindestqualifikation Trainer
          <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={profile?.minimumTrainerQualification ?? "assistant"} name="minimumTrainerQualification">
            {TRAINER_QUALIFICATION_LEVELS.map((level) => <option key={level} value={level}>{TRAINER_QUALIFICATION_LABELS[level]}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold">Mindestalter<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={profile?.minAge ?? 7} max={17} min={3} name="minAge" type="number" /></label>
        <label className="grid gap-1.5 text-sm font-bold">Höchstalter<input className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={profile?.maxAge ?? 11} max={17} min={3} name="maxAge" type="number" /></label>
        <label className="grid gap-1.5 text-sm font-bold">
          Maximales Risiko
          <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={profile?.maximumRiskLevel ?? "medium"} name="maximumRiskLevel">
            <option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Maximaler Impact
          <select className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal" defaultValue={profile?.maximumImpactLevel ?? "moderate"} name="maximumImpactLevel">
            <option value="low">Niedrig</option><option value="moderate">Moderat</option><option value="high">Hoch</option>
          </select>
        </label>
      </div>
      <label className="mt-4 grid gap-1.5 text-sm font-bold">
        Hinweise
        <textarea className="min-h-20 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-normal" defaultValue={profile?.notes ?? ""} maxLength={1200} name="notes" />
      </label>
      <details className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" open={restricted.size > 0}>
        <summary className="cursor-pointer text-sm font-black">Gesperrte Hindernisse ({restricted.size})</summary>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Diese Hindernisse werden für Gruppen mit diesem Profil bereits vor lokaler oder AI-Planung aus dem Kandidatenpool entfernt.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {obstacles.map((obstacle) => (
            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-bold" key={obstacle.id}>
              <input defaultChecked={restricted.has(obstacle.id)} name="restrictedExerciseIds" type="checkbox" value={obstacle.id} />
              <span>{obstacle.name}</span>
            </label>
          ))}
        </div>
      </details>
    </>
  );
}

function Message({ children, success = false }: { readonly children: ReactNode; readonly success?: boolean }) {
  return <div className={success
    ? "rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm font-bold text-[var(--success-foreground)]"
    : "rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]"}>{children}</div>;
}
function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return <div className="rounded-xl bg-[var(--surface-subtle)] p-3"><dt className="text-xs font-bold text-[var(--muted)]">{label}</dt><dd className="mt-1 font-black">{value}</dd></div>;
}
function riskLabel(value: string) { return value === "low" ? "Niedrig" : value === "medium" ? "Mittel" : "Hoch"; }
function impactLabel(value: string) { return value === "low" ? "Niedrig" : value === "moderate" ? "Moderat" : "Hoch"; }
function supervisionLabel(value: string) { return value === "direct" ? "Direkt" : value === "increased" ? "Erhöht" : "Normal"; }
