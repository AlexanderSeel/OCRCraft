import { describe, expect, it } from "vitest";
import {
  trainerQualificationBlockReason,
  trainerQualificationMeets,
} from "./trainer-qualification";

describe("trainer qualification", () => {
  it("uses an ordered qualification hierarchy", () => {
    expect(trainerQualificationMeets("trainer_a","trainer_c")).toBe(true);
    expect(trainerQualificationMeets("trainer_c","trainer_c")).toBe(true);
    expect(trainerQualificationMeets("assistant","trainer_c")).toBe(false);
  });

  it("returns a clear German blocking reason", () => {
    expect(trainerQualificationBlockReason("assistant","trainer_c","Medienfreigabe"))
      .toContain("Medienfreigabe benötigt mindestens Trainer C");
    expect(trainerQualificationBlockReason("trainer_b","trainer_c","Medienfreigabe"))
      .toBeNull();
  });
});
