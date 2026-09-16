import { describe, expect, it } from "vitest";
import { parseAgeRange } from "./quick-create-draft-client";

describe("parseAgeRange", () => {
  it("parses open-ended ages", () => {
    expect(parseAgeRange("16+")).toEqual({ minAge: 16 });
  });

  it("parses common age ranges regardless of separator", () => {
    expect(parseAgeRange("8-12")).toEqual({ minAge: 8, maxAge: 12 });
    expect(parseAgeRange("12–8 Jahre")).toEqual({ minAge: 8, maxAge: 12 });
  });

  it("treats one exact age as both minimum and maximum", () => {
    expect(parseAgeRange("10 Jahre")).toEqual({ minAge: 10, maxAge: 10 });
  });

  it("leaves non-numeric free text unconstrained", () => {
    expect(parseAgeRange("Erwachsene")).toEqual({});
  });
});
