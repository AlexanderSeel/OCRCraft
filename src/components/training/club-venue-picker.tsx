"use client";

import { useId } from "react";
import { CLUB_VENUE_IDS, type ClubVenueId } from "@/domain/training/club-venues";
import { useLocale } from "@/components/i18n/locale-provider";
import { formControlClass } from "@/components/ui/form";

export function ClubVenuePicker({ value, onChange }: {
  readonly value: ClubVenueId | undefined;
  readonly onChange: (value: ClubVenueId | undefined) => void;
}) {
  const id = useId();
  const { dictionary } = useLocale();
  const copy = dictionary.venues;
  const detail = value === "synthetic-court" ? copy.court : value === "athletics-field" ? copy.track : copy.unknown;
  return <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4" data-testid="club-venue-picker">
    <label className="mb-2 block text-sm font-bold" htmlFor={id}>{copy.title}</label>
    <select aria-describedby={`${id}-help`} className={formControlClass} id={id} value={value ?? ""}
      onChange={(event) => onChange(CLUB_VENUE_IDS.find((venue) => venue === event.target.value))}>
      <option value="">{copy.none}</option>
      {CLUB_VENUE_IDS.map((venue) => <option key={venue} value={venue}>{copy.names[venue]}</option>)}
    </select>
    <div className="mt-2 space-y-2 text-sm leading-6 text-[var(--muted)]" id={`${id}-help`}>
      <p>{copy.help}</p>
      {value ? <p>{detail}</p> : null}
    </div>
  </div>;
}
