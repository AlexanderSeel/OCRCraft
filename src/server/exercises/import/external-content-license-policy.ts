const PLACEHOLDER_LICENSES = new Set([
  "",
  "unknown",
  "none",
  "unlicensed",
  "license required",
  "tbd",
  "n/a",
  "na",
]);

export interface ExternalContentLicensePolicy {
  readonly normalizedLicenseLabel: string | null;
  readonly licensedCopyAllowed: boolean;
  readonly mediaCopyAllowed: boolean;
  readonly reason: string;
}

export function evaluateExternalContentLicense(
  licenseLabel: string | null | undefined,
  verified = false,
): ExternalContentLicensePolicy {
  const normalized = licenseLabel?.trim() ?? "";
  const normalizedKey = normalized.toLocaleLowerCase("en-US");
  if (!verified || normalized.length < 3 || PLACEHOLDER_LICENSES.has(normalizedKey)) {
    return {
      normalizedLicenseLabel: null,
      licensedCopyAllowed: false,
      mediaCopyAllowed: false,
      reason: verified
        ? "Kein expliziter verwertbarer Lizenz-/Rechtenachweis vorhanden."
        : "Lizenz-/Rechtenachweis wurde nicht ausdrücklich als geprüft bestätigt.",
    };
  }
  return {
    normalizedLicenseLabel: normalized,
    licensedCopyAllowed: true,
    mediaCopyAllowed: !/(media|visual|image|video|attribution)/i.test(normalized),
    reason: "Expliziter Lizenz-/Rechtenachweis wurde mit dem Quelldatensatz geliefert.",
  };
}
