import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function encryptionKey(): Buffer | null {
  const secret = process.env.OCRCRAFT_AI_SECRET_KEY?.trim();
  if (!secret) return null;
  return createHash("sha256").update(secret, "utf8").digest();
}

export function canStoreAiProviderSecret(): boolean {
  return encryptionKey() !== null;
}

export function encryptAiProviderSecret(value: string): string {
  const key = encryptionKey();
  if (!key) {
    throw new Error("OCRCRAFT_AI_SECRET_KEY fehlt. API-Keys können nicht sicher in der Datenbank gespeichert werden.");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptAiProviderSecret(value: string): string {
  const key = encryptionKey();
  if (!key) throw new Error("OCRCRAFT_AI_SECRET_KEY fehlt.");
  const [version, ivText, tagText, encryptedText] = value.split(".");
  if (version !== "v1" || !ivText || !tagText || !encryptedText) {
    throw new Error("Gespeicherter AI-API-Key hat ein unbekanntes Format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
