import { describe, expect, it } from "vitest";
import { getLegacyMediaMigrationState } from "./legacy-media-migration-core";

describe("legacy media migration state", () => {
  it("prefers an approved sequence over all other states", () => {
    expect(getLegacyMediaMigrationState({
      activeJobCount: 1,
      pendingSequenceCount: 1,
      approvedSequenceCount: 1,
    })).toBe("ready_to_finalize");
  });

  it("reports generation before review-pending when a job is active", () => {
    expect(getLegacyMediaMigrationState({
      activeJobCount: 1,
      pendingSequenceCount: 1,
      approvedSequenceCount: 0,
    })).toBe("generating");
  });

  it("distinguishes pending review from a missing sequence", () => {
    expect(getLegacyMediaMigrationState({
      activeJobCount: 0,
      pendingSequenceCount: 1,
      approvedSequenceCount: 0,
    })).toBe("review_pending");
    expect(getLegacyMediaMigrationState({
      activeJobCount: 0,
      pendingSequenceCount: 0,
      approvedSequenceCount: 0,
    })).toBe("needs_generation");
  });
});
