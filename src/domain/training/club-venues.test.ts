import { expect, it } from "vitest";
import { CLUB_VENUES, defaultVenueRunningTrigger, effectiveTrainingLocation, getClubVenue } from "./club-venues";

it("records only supplied venue facts and leaves usable space, clearances and stock unknown", () => {
  expect(CLUB_VENUES).toHaveLength(4);
  expect(getClubVenue("synthetic-court")).toMatchObject({ overallDimensionsMeters: { length: 40, width: 20 }, surface: "synthetic-grass", runningLoopMeters: null });
  expect(getClubVenue("athletics-field")).toMatchObject({ overallDimensionsMeters: null, surface: "not-recorded", runningLoopMeters: 400 });
  expect(CLUB_VENUES.every((venue) => venue.usableDimensionsMeters === null && venue.equipmentStock === null && venue.safetyClearancesMeters === null)).toBe(true);
});

it("uses outdoor eligibility for every selected venue even when the general location was flexible", () => {
  for (const venue of CLUB_VENUES) expect(effectiveTrainingLocation({ location: "mixed", venueId: venue.id })).toBe("outdoor");
  expect(effectiveTrainingLocation({ location: "indoor" })).toBe("indoor");
});

it("uses the supplied 400 m loop but never derives a route from overall court or field size", () => {
  expect(defaultVenueRunningTrigger("athletics-field")).toEqual({ everyUnit: "metres", everyValue: 400 });
  for (const id of [undefined, "large-field", "obstacle-area", "synthetic-court"] as const) {
    expect(defaultVenueRunningTrigger(id)).toEqual({ everyUnit: "checkpoint", everyValue: 1 });
  }
});
