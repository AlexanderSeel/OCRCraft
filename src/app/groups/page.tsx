import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Disclosure } from "@/components/ui/disclosure";
import type { ClubGroup } from "@/server/groups/group-repository";
import { listClubGroups } from "@/server/groups/group-repository";
import {
  listTrainingEquipmentOptions,
  type TrainingEquipmentOption,
} from "@/server/training/training-draft-repository";
import {
  createClubGroupAction,
  setClubGroupArchivedAction,
  updateClubGroupAction,
} from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly searchParams: Promise<{ archived?: string; saved?: string; error?: string }>;
}

export default async function GroupsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const archivedView = query.archived === "1";
  const [allGroups, equipmentOptions] = await Promise.all([
    listClubGroups(archivedView),
    listTrainingEquipmentOptions("de"),
  ]);
  const groups = archivedView ? allGroups.filter((group) => group.archived) : allGroups;

  return (
    <AppShell
      title={archivedView ? "Gruppen · Archiv" : "Gruppen"}
      subtitle="Trainingsgruppen mit Alter, Teilnehmerzahl, Standarddauer, Trainingsort, Materialbestand und Risikorahmen verwalten."
      actions={
        <Link
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black hover:bg-[var(--surface-subtle)]"
          href={archivedView ? "/groups" : "/groups?archived=1"}
        >
          {archivedView ? "Aktive Gruppen" : "Archiv"}
        </Link>
      }
    >
      <div className="space-y-6">
        {query.saved ? (
          <div className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm font-bold text-[var(--success-foreground)]">
            {savedMessage(query.saved)}
          </div>
        ) : null}
        {query.error ? (
          <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]">
            Gruppe konnte nicht gespeichert werden. Bitte Eingaben und Altersbereich prüfen.
          </div>
        ) : null}

        {!archivedView ? (
          <Disclosure className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]" summaryClassName="px-5 py-4 font-black" summary="+ Neue Gruppe anlegen">
            <form action={createClubGroupAction} className="border-t border-[var(--border)] p-5">
              <GroupFields equipmentOptions={equipmentOptions} />
              <div className="mt-4 flex justify-end">
                <button
                  className="min-h-11 rounded-xl bg-[var(--control-strong)] px-5 text-sm font-black text-[var(--control-strong-foreground)] hover:bg-[var(--control-strong-hover)]"
                  type="submit"
                >
                  Gruppe anlegen
                </button>
              </div>
            </form>
          </Disclosure>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-2">
          {groups.map((group) => (
            <article
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
              key={group.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                    {audienceLabel(group.audience)}
                  </div>
                  <h2 className="mt-1 text-xl font-black">{group.name}</h2>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2.5 py-1 text-xs font-bold">
                  {group.archived ? "Archiviert" : "Aktiv"}
                </span>
              </div>

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                <GroupMetric label="Alter" value={ageLabel(group)} />
                <GroupMetric label="Teilnehmer" value={String(group.defaultParticipantCount)} />
                <GroupMetric label="Dauer" value={group.defaultDurationMinutes ? `${group.defaultDurationMinutes} Min.` : "–"} />
                <GroupMetric label="Ort" value={locationLabel(group.defaultLocation)} />
                <GroupMetric label="Equipment" value={group.defaultEquipment.length ? `${group.defaultEquipment.length} Overrides` : "Global"} />
                <GroupMetric label="Max. Risiko" value={riskLabel(group.maximumRiskLevel)} />
              </dl>

              <div className="mt-3 text-xs font-semibold text-[var(--muted)]">
                {group.linkedTrainingCount} verknüpfte Trainings · Standardsprache {group.defaultLocale.toUpperCase()}
              </div>

              <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-[var(--border)] pt-4">
                {!group.archived ? (
                  <Disclosure className="min-w-[280px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]" summaryClassName="px-4 py-3 text-sm font-black" summary="Gruppe bearbeiten">
                    <form action={updateClubGroupAction} className="border-t border-[var(--border)] p-4">
                      <input name="id" type="hidden" value={group.id} />
                      <GroupFields equipmentOptions={equipmentOptions} group={group} />
                      <div className="mt-4 flex justify-end">
                        <button
                          className="rounded-lg bg-[var(--control-strong)] px-4 py-2 text-xs font-black text-[var(--control-strong-foreground)]"
                          type="submit"
                        >
                          Änderungen speichern
                        </button>
                      </div>
                    </form>
                  </Disclosure>
                ) : null}

                <form action={setClubGroupArchivedAction}>
                  <input name="id" type="hidden" value={group.id} />
                  <input name="archived" type="hidden" value={group.archived ? "false" : "true"} />
                  <button
                    className={group.archived
                      ? "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-black hover:bg-[var(--surface-subtle)]"
                      : "rounded-xl border border-[var(--danger)] px-4 py-3 text-sm font-black text-[var(--danger)] hover:bg-[var(--danger-bg)]"}
                    type="submit"
                  >
                    {group.archived ? "Wiederherstellen" : "Archivieren"}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </section>

        {groups.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
            <h2 className="text-lg font-black">{archivedView ? "Keine archivierten Gruppen" : "Noch keine Gruppen"}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              {archivedView
                ? "Archivierte Gruppen erscheinen hier und können jederzeit wiederhergestellt werden."
                : "Lege Gruppen für Kinder, Jugend, Erwachsene oder gemischte Trainings an. Die Standardwerte können später von Quick Create übernommen werden."}
            </p>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function GroupFields({
  group,
  equipmentOptions,
}: {
  readonly group?: ClubGroup;
  readonly equipmentOptions: readonly TrainingEquipmentOption[];
}) {
  const equipmentById = new Map(group?.defaultEquipment.map((item) => [item.equipmentId, item.quantityAvailable]) ?? []);
  return (
    <>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <label className="grid gap-1.5 text-sm font-bold md:col-span-2">
        Name
        <input
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal outline-none focus:border-[var(--focus)]"
          defaultValue={group?.name ?? ""}
          maxLength={120}
          name="name"
          placeholder="z. B. OCR Kids Mittwoch"
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm font-bold">
        Zielgruppe
        <select
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={group?.audience ?? "mixed"}
          name="audience"
        >
          <option value="kids">Kinder</option>
          <option value="youth">Jugend</option>
          <option value="adults">Erwachsene</option>
          <option value="mixed">Gemischt</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-bold">
        Standardsprache
        <select
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={group?.defaultLocale ?? "de"}
          name="defaultLocale"
        >
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-bold">
        Mindestalter
        <input
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={group?.minAge ?? ""}
          max={99}
          min={3}
          name="minAge"
          type="number"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-bold">
        Höchstalter
        <input
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={group?.maxAge ?? ""}
          max={99}
          min={3}
          name="maxAge"
          type="number"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-bold">
        Teilnehmerzahl
        <input
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={group?.defaultParticipantCount ?? 12}
          max={500}
          min={1}
          name="defaultParticipantCount"
          required
          type="number"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-bold">
        Standarddauer (Min.)
        <input
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={group?.defaultDurationMinutes ?? 60}
          max={480}
          min={10}
          name="defaultDurationMinutes"
          type="number"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-bold">
        Standard-Trainingsort
        <select
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={group?.defaultLocation ?? "mixed"}
          name="defaultLocation"
        >
          <option value="mixed">Flexibel</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-bold">
        Maximales Risikoniveau
        <select
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 font-normal"
          defaultValue={group?.maximumRiskLevel ?? ""}
          name="maximumRiskLevel"
        >
          <option value="">Kein Gruppenlimit</option>
          <option value="low">Niedrig</option>
          <option value="medium">Mittel</option>
          <option value="high">Hoch</option>
        </select>
      </label>
    </div>

    <details className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4" open={Boolean(group?.defaultEquipment.length)}>
      <summary className="cursor-pointer text-sm font-black">
        Standard-Equipment für Quick Create ({group?.defaultEquipment.length ?? 0} Overrides)
      </summary>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
        Leeres Feld nutzt den globalen OCRCraft-Bestand. 0 bedeutet für diese Gruppe bewusst nicht verfügbar; positive Werte überschreiben den globalen Bestand.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {equipmentOptions.map((option) => (
          <label className="grid gap-1 text-xs font-bold" key={option.id}>
            {option.name}
            <input
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 font-normal"
              defaultValue={equipmentById.get(option.id) ?? ""}
              max={500}
              min={0}
              name={`equipmentQty:${option.id}`}
              placeholder={option.quantityAvailable == null ? "Global: unbekannt" : `Global: ${option.quantityAvailable}`}
              type="number"
            />
          </label>
        ))}
      </div>
    </details>
    </>
  );
}

function GroupMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-subtle)] p-3">
      <dt className="text-xs font-bold text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 font-black">{value}</dd>
    </div>
  );
}

function audienceLabel(audience: ClubGroup["audience"]): string {
  if (audience === "kids") return "Kinder";
  if (audience === "youth") return "Jugend";
  if (audience === "adults") return "Erwachsene";
  return "Gemischt";
}

function ageLabel(group: ClubGroup): string {
  if (group.minAge != null && group.maxAge != null) return `${group.minAge}–${group.maxAge}`;
  if (group.minAge != null) return `ab ${group.minAge}`;
  if (group.maxAge != null) return `bis ${group.maxAge}`;
  return "offen";
}

function locationLabel(location: ClubGroup["defaultLocation"]): string {
  if (location === "indoor") return "Indoor";
  if (location === "outdoor") return "Outdoor";
  return "Flexibel";
}

function riskLabel(risk: ClubGroup["maximumRiskLevel"]): string {
  if (risk === "low") return "Niedrig";
  if (risk === "medium") return "Mittel";
  if (risk === "high") return "Hoch";
  return "Kein Limit";
}

function savedMessage(saved: string): string {
  if (saved === "created") return "Gruppe wurde angelegt.";
  if (saved === "updated") return "Gruppe wurde aktualisiert.";
  if (saved === "archived") return "Gruppe wurde archiviert.";
  if (saved === "restored") return "Gruppe wurde wiederhergestellt.";
  return "Gruppe wurde gespeichert.";
}
