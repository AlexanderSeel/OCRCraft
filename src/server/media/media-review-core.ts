export type MediaAssessmentStatus = "unreviewed" | "pass" | "needs_changes";

export interface MediaApprovalReadinessInput {
  readonly sourceType: string;
  readonly illustrationFormat: string | null;
  readonly rightsStatus: string;
  readonly licenseLabel: string | null;
  readonly sourceReference: string | null;
  readonly consentRequired: boolean;
  readonly consentConfirmed: boolean;
  readonly biomechanicsReview: MediaAssessmentStatus;
  readonly textMatchReview: MediaAssessmentStatus;
}

export function canApproveMediaReview(input: MediaApprovalReadinessInput): boolean {
  if (input.sourceType === "external_reference") {
    if (input.rightsStatus !== "approved") return false;
    if (!input.licenseLabel?.trim() || !input.sourceReference?.trim()) return false;
    if (input.consentRequired && !input.consentConfirmed) return false;
  }

  if (input.sourceType === "ai_generated" && input.illustrationFormat === "exercise_sequence") {
    return input.biomechanicsReview === "pass" && input.textMatchReview === "pass";
  }

  return true;
}
