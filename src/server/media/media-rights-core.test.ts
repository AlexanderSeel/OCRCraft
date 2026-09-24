import { describe, expect, it } from "vitest";
import {
  getMediaGenerationCandidateReason,
  hasUsableExternalMediaRights,
} from "./media-rights-core";

describe("media rights replacement policy", () => {
  it("requires complete rights metadata for external media", () => {
    expect(hasUsableExternalMediaRights({
      sourceType: "external_reference",
      rightsStatus: "approved",
      licenseLabel: "CC BY 4.0",
      sourceReference: "https://example.test/source",
      consentRequired: false,
      consentConfirmed: false,
    })).toBe(true);

    expect(hasUsableExternalMediaRights({
      sourceType: "external_reference",
      rightsStatus: "unreviewed",
      licenseLabel: "CC BY 4.0",
      sourceReference: "https://example.test/source",
      consentRequired: false,
      consentConfirmed: false,
    })).toBe(false);

    expect(hasUsableExternalMediaRights({
      sourceType: "external_reference",
      rightsStatus: "approved",
      licenseLabel: "",
      sourceReference: "https://example.test/source",
      consentRequired: false,
      consentConfirmed: false,
    })).toBe(false);

    expect(hasUsableExternalMediaRights({
      sourceType: "external_reference",
      rightsStatus: "approved",
      licenseLabel: "Vereinseigen",
      sourceReference: "https://example.test/source",
      consentRequired: true,
      consentConfirmed: false,
    })).toBe(false);
  });

  it("does not apply external-rights blocking to local or generated media", () => {
    expect(hasUsableExternalMediaRights({
      sourceType: "ai_generated",
      rightsStatus: "unreviewed",
      licenseLabel: null,
      sourceReference: null,
      consentRequired: false,
      consentConfirmed: false,
    })).toBe(true);
  });

  it("prioritizes rights-blocked assets in replacement diagnostics", () => {
    expect(getMediaGenerationCandidateReason({
      imageAssetCount: 2,
      failedImageCount: 1,
      rightsBlockedImageCount: 1,
      activeJobCount: 0,
    })).toBe("rights_blocked");

    expect(getMediaGenerationCandidateReason({
      imageAssetCount: 1,
      failedImageCount: 1,
      rightsBlockedImageCount: 0,
      activeJobCount: 0,
    })).toBe("generation_failed");

    expect(getMediaGenerationCandidateReason({
      imageAssetCount: 0,
      failedImageCount: 0,
      rightsBlockedImageCount: 0,
      activeJobCount: 0,
    })).toBe("missing");
  });
});
