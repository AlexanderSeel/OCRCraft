import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email();
const assertionSchema = z.object({
  email: emailSchema,
  issuedAt: z.number().int().positive(),
  signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

export interface ActorAssertion {
  readonly email: string;
  readonly issuedAt: number;
}

/** Signs the canonical payload expected from a trusted club identity proxy. */
export function signActorAssertion(email: string, issuedAt: number, secret: string): string {
  const normalizedEmail = emailSchema.parse(email);
  const timestamp = z.number().int().positive().parse(issuedAt);
  const payload = `${normalizedEmail}|${timestamp}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Validates `email|unixSeconds|hexSignature` without trusting any client value.
 * The proxy secret must stay outside the repository and process logs.
 */
export function verifyActorAssertion(
  value: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  maxAgeSeconds = 300,
): ActorAssertion | null {
  if (!secret || !value) return null;
  const [email, issuedAtText, signature] = value.split("|");
  const parsed = assertionSchema.safeParse({ email, issuedAt: Number(issuedAtText), signature });
  if (!parsed.success || parsed.data.issuedAt > nowSeconds || nowSeconds - parsed.data.issuedAt > maxAgeSeconds) return null;
  const expected = signActorAssertion(parsed.data.email, parsed.data.issuedAt, secret);
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(parsed.data.signature, "hex");
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) return null;
  return { email: parsed.data.email, issuedAt: parsed.data.issuedAt };
}
