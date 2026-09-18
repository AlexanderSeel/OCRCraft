export interface YouthSafetyProfileCompatibilityInput {
  readonly audience: "kids" | "youth";
  readonly minAge: number;
  readonly maxAge: number;
}

export interface YouthSafetyGroupCompatibilityInput {
  readonly audience: "kids" | "youth" | "adults" | "mixed";
  readonly minAge: number | null;
  readonly maxAge: number | null;
}

export type YouthSafetyCompatibility =
  | { readonly compatible: true }
  | { readonly compatible: false; readonly reason: "audience" | "missing-age-range" | "age-range" };

export function assessYouthSafetyProfileCompatibility(
  group: YouthSafetyGroupCompatibilityInput,
  profile: YouthSafetyProfileCompatibilityInput,
): YouthSafetyCompatibility {
  if (group.audience !== profile.audience) {
    return { compatible: false, reason: "audience" };
  }
  if (group.minAge == null || group.maxAge == null) {
    return { compatible: false, reason: "missing-age-range" };
  }
  if (group.minAge < profile.minAge || group.maxAge > profile.maxAge) {
    return { compatible: false, reason: "age-range" };
  }
  return { compatible: true };
}
