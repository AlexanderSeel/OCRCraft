import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the original password but not another password", () => {
    const encoded = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", encoded)).toBe(true);
    expect(verifyPassword("wrong password", encoded)).toBe(false);
  });

  it("rejects malformed hashes and short passwords", () => {
    expect(verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(() => hashPassword("short")).toThrow();
  });
});
