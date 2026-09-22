import { describe, expect, it } from "vitest";
import { evaluateExternalContentLicense } from "./external-content-license-policy";

describe("external content license policy", () => {
  it("blocks missing and placeholder license labels", () => {
    for (const value of [undefined, "", "unknown", "N/A", "license required"]) {
      expect(evaluateExternalContentLicense(value, true)).toMatchObject({ licensedCopyAllowed: false, mediaCopyAllowed: false });
    }
  });

  it("allows explicitly supplied license/right labels without interpreting their legal scope", () => {
    expect(evaluateExternalContentLicense("CC BY 4.0", false).licensedCopyAllowed).toBe(false);
    expect(evaluateExternalContentLicense("CC BY 4.0", true)).toMatchObject({
      licensedCopyAllowed: true,
      mediaCopyAllowed: true,
      normalizedLicenseLabel: "CC BY 4.0",
    });
    expect(evaluateExternalContentLicense("Verein hat Nutzungsrecht", true)).toMatchObject({
      licensedCopyAllowed: true,
      mediaCopyAllowed: true,
      normalizedLicenseLabel: "Verein hat Nutzungsrecht",
    });
    expect(evaluateExternalContentLicense("MIT for dataset metadata; Gym visual media attribution retained", true)).toMatchObject({
      licensedCopyAllowed: true,
      mediaCopyAllowed: false,
    });
  });
});
