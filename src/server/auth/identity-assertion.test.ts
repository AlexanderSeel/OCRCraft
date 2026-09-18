import { describe, expect, it } from "vitest";
import { signActorAssertion, verifyActorAssertion } from "./identity-assertion";

describe("signed actor assertions", () => {
  const secret = "test-only-identity-secret";
  const issuedAt = 1_700_000_000;

  it("accepts a fresh assertion and normalizes the email", () => {
    const signature = signActorAssertion("Trainer@Example.org", issuedAt, secret);
    expect(verifyActorAssertion(`trainer@example.org|${issuedAt}|${signature}`, secret, issuedAt + 60)).toEqual({
      email: "trainer@example.org",
      issuedAt,
    });
  });

  it("rejects tampering, stale assertions and future timestamps", () => {
    const signature = signActorAssertion("trainer@example.org", issuedAt, secret);
    expect(verifyActorAssertion(`admin@example.org|${issuedAt}|${signature}`, secret, issuedAt + 60)).toBeNull();
    expect(verifyActorAssertion(`trainer@example.org|${issuedAt}|${signature}`, secret, issuedAt + 301)).toBeNull();
    expect(verifyActorAssertion(`trainer@example.org|${issuedAt + 1}|${signature}`, secret, issuedAt)).toBeNull();
  });
});
