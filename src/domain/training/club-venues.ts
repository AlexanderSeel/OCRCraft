import type { TrainingLocation } from "./model";

export const CLUB_VENUE_IDS = ["large-field", "obstacle-area", "synthetic-court", "athletics-field"] as const;
export type ClubVenueId = (typeof CLUB_VENUE_IDS)[number];

export interface ClubVenueProfile {
  readonly id: ClubVenueId;
  readonly version: 1;
  readonly location: "outdoor";
  readonly source: "trainer-provided-site-description";
  readonly surface: "synthetic-grass" | "not-recorded";
  /** Overall dimensions, never an automatically usable exercise footprint. */
  readonly overallDimensionsMeters: { readonly length: number; readonly width: number } | null;
  readonly runningLoopMeters: number | null;
  readonly usableDimensionsMeters: null;
  readonly equipmentStock: null;
  readonly safetyClearancesMeters: null;
}

export const CLUB_VENUES: readonly ClubVenueProfile[] = CLUB_VENUE_IDS.map((id) => ({
  id, version: 1, location: "outdoor", source: "trainer-provided-site-description",
  surface: id === "synthetic-court" ? "synthetic-grass" : "not-recorded",
  overallDimensionsMeters: id === "synthetic-court" ? { length: 40, width: 20 } : null,
  runningLoopMeters: id === "athletics-field" ? 400 : null,
  usableDimensionsMeters: null, equipmentStock: null, safetyClearancesMeters: null,
}));

export function getClubVenue(id: ClubVenueId | undefined): ClubVenueProfile | undefined {
  return CLUB_VENUES.find((venue) => venue.id === id);
}

export function effectiveTrainingLocation(request: { readonly venueId?: ClubVenueId; readonly location: TrainingLocation }): TrainingLocation {
  return getClubVenue(request.venueId)?.location ?? request.location;
}

/** No measured route is inferred from court boundaries or an unspecified field. */
export function defaultVenueRunningTrigger(venueId?: ClubVenueId) {
  const loop = getClubVenue(venueId)?.runningLoopMeters;
  return loop
    ? { everyUnit: "metres" as const, everyValue: loop }
    : { everyUnit: "checkpoint" as const, everyValue: 1 };
}
