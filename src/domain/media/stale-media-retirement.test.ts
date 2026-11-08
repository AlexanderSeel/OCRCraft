import { expect, it } from "vitest";
import { planStaleMediaRetirement, type MediaIntegrityCandidate } from "./stale-media-retirement";

const stale: MediaIntegrityCandidate = { id: "old", exerciseId: "exercise", storageUri: "/generated/exercises/shared.png",
  recordedHash: "a".repeat(64), actualHash: "b".repeat(64), integrity: "checksum_mismatch", reviewStatus: "pending",
  generationStatus: "generated", sourceType: "ai_generated", illustrationFormat: "exercise_sequence", isPrimary: false,
  biomechanicsReview: "unreviewed", textMatchReview: "unreviewed", activeJobs: 0 };
const survivor: MediaIntegrityCandidate = { ...stale, id: "new", recordedHash: stale.actualHash, integrity: "verified" };

it("retires only a stale duplicate while leaving the matching survivor unapproved", () => {
  expect(planStaleMediaRetirement([stale, survivor])).toEqual({ candidates: [{ assetId: "old", exerciseId: "exercise",
    storageUri: stale.storageUri, recordedHash: stale.recordedHash, actualHash: stale.actualHash, survivingAssetId: "new" }], blocked: [] });
  expect(survivor.reviewStatus).toBe("pending");
});

it.each([
  { isPrimary: true }, { reviewStatus: "approved" }, { biomechanicsReview: "pass" }, { textMatchReview: "needs_changes" },
  { activeJobs: 1 }, { sourceType: "club_created" }, { recordedHash: "" },
])("keeps protected or ambiguous stale records for explicit review: %j", (changes) => {
  const result = planStaleMediaRetirement([{ ...stale, ...changes }, survivor]);
  expect(result.candidates).toEqual([]);
  expect(result.blocked).toHaveLength(1);
});

it.each([{ exerciseId: "another-exercise" }, { storageUri: "/generated/exercises/other.png" }, { reviewStatus: "rejected" }, { activeJobs: 1 }, { integrity: "checksum_mismatch" }])(
  "requires a matching usable survivor: %j", (changes) => {
    const result = planStaleMediaRetirement([stale, { ...survivor, ...changes }]);
    expect(result.candidates).toEqual([]);
    expect(result.blocked).toContainEqual({ assetId: "old", reason: "no-matching-survivor" });
  },
);

it("does not reconsider technically retired history on subsequent runs", () => {
  expect(planStaleMediaRetirement([{ ...stale, reviewStatus: "rejected" }, survivor])).toEqual({ candidates: [], blocked: [] });
});
