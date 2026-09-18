import { describe, expect, it } from "vitest";
import { canApproveMediaReview } from "./media-review-core";

const base = {
  sourceType: "ai_generated",
  illustrationFormat: "exercise_sequence" as string | null,
  rightsStatus: "unreviewed",
  licenseLabel: null,
  sourceReference: null,
  consentRequired: false,
  consentConfirmed: false,
  biomechanicsReview: "unreviewed" as const,
  textMatchReview: "unreviewed" as const,
};

describe("media review approval gate", () => {
  it("requires both biomechanical and text checks for generated sequences", () => {
    expect(canApproveMediaReview(base)).toBe(false);
    expect(canApproveMediaReview({
      ...base,
      biomechanicsReview: "pass",
      textMatchReview: "pass",
    })).toBe(true);
  });

  it("requires rights, source, license, and consent for external media", () => {
    expect(canApproveMediaReview({
      ...base,
      sourceType: "external_reference",
      illustrationFormat: null,
      biomechanicsReview: "unreviewed",
      textMatchReview: "unreviewed",
      rightsStatus: "approved",
      licenseLabel: "Vereinseigen",
      sourceReference: "https://example.test/source",
      consentRequired: true,
      consentConfirmed: false,
    })).toBe(false);

    expect(canApproveMediaReview({
      ...base,
      sourceType: "external_reference",
      illustrationFormat: null,
      biomechanicsReview: "unreviewed",
      textMatchReview: "unreviewed",
      rightsStatus: "approved",
      licenseLabel: "Vereinseigen",
      sourceReference: "https://example.test/source",
      consentRequired: true,
      consentConfirmed: true,
    })).toBe(true);
  });
});
