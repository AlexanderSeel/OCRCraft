export interface ExternalMediaRightsInput {
  readonly sourceType: string;
  readonly rightsStatus: string;
  readonly licenseLabel: string | null;
  readonly sourceReference: string | null;
  readonly consentRequired: boolean;
  readonly consentConfirmed: boolean;
}

export function hasUsableExternalMediaRights(input: ExternalMediaRightsInput): boolean {
  if (input.sourceType !== "external_reference") return true;
  if (input.rightsStatus !== "approved") return false;
  if (!input.licenseLabel?.trim() || !input.sourceReference?.trim()) return false;
  if (input.consentRequired && !input.consentConfirmed) return false;
  return true;
}

export interface MediaGenerationCandidateStateInput {
  readonly imageAssetCount: number;
  readonly failedImageCount: number;
  readonly rightsBlockedImageCount: number;
  readonly activeJobCount: number;
}

export type MediaGenerationCandidateReason =
  | "job_running"
  | "rights_blocked"
  | "generation_failed"
  | "unusable"
  | "missing";

export function getMediaGenerationCandidateReason(
  input: MediaGenerationCandidateStateInput,
): MediaGenerationCandidateReason {
  if (input.activeJobCount > 0) return "job_running";
  if (input.rightsBlockedImageCount > 0) return "rights_blocked";
  if (input.failedImageCount > 0) return "generation_failed";
  if (input.imageAssetCount > 0) return "unusable";
  return "missing";
}
