import "server-only";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { isRoleAtLeast } from "./identity-core";
import { verifyActorAssertion } from "./identity-assertion";
import { hashPassword, verifyPassword } from "./password";

export const userRoleSchema = z.enum(["trainer", "admin", "super_admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export interface AppUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly active: boolean;
  readonly createdAt: string;
  readonly education: string | null;
  readonly bio: string | null;
  readonly specialties: string | null;
  readonly profileImageUri: string | null;
  readonly profileImageDataUrl: string | null;
}

export interface CurrentActor extends AppUser {
  readonly source: "configured" | "assertion" | "bootstrap";
}

const emailSchema = z.string().trim().toLowerCase().email();

/**
 * Resolves the server actor used for audit and authorization. In the private
 * club deployment the first request bootstraps a local super-admin. Set
 * OCRCRAFT_AUTH_REQUIRED=1 to require an explicitly configured actor.
 */
export async function requireRole(required: UserRole): Promise<CurrentActor> {
  await ensureDatabaseReady();
  const configuredEmail = emailSchema.safeParse(process.env.OCRCRAFT_ACTOR_EMAIL ?? "").data;
  const assertedEmail = await resolveAssertedActorEmail();
  const authRequired = process.env.OCRCRAFT_AUTH_REQUIRED === "1";
  const email = assertedEmail?.email ?? configuredEmail ?? "owner@ocrcraft.local";

  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT id::VARCHAR,email,display_name,role,active,created_at::VARCHAR
       FROM app_users WHERE lower(email)=lower($email) LIMIT 1`,
      { email },
    );
    let row = reader.getRows()[0];
    let source: CurrentActor["source"] = assertedEmail ? "assertion" : "configured";

    if (!row && !authRequired && email === "owner@ocrcraft.local") {
      await connection.run(
        `INSERT INTO app_users (email,display_name,role) VALUES ($email,$displayName,'super_admin')`,
        { email, displayName: "OCRCraft Owner" },
      );
      const created = await connection.runAndReadAll(
        `SELECT id::VARCHAR,email,display_name,role,active,created_at::VARCHAR
         FROM app_users WHERE lower(email)=lower($email) LIMIT 1`,
        { email },
      );
      row = created.getRows()[0];
      source = "bootstrap";
    }

    if (!row) throw new Error("No authenticated OCRCraft actor is configured.");
    const actor = toUser(row, source);
    if (!actor.active || !isRoleAtLeast(actor.role, required)) {
      throw new Error("The current OCRCraft actor is not authorized for this action.");
    }
    return actor;
  });
}

async function resolveAssertedActorEmail(): Promise<{ readonly email: string } | null> {
  const secret = process.env.OCRCRAFT_ACTOR_ASSERTION_SECRET;
  if (!secret) return null;
  const headerName = process.env.OCRCRAFT_ACTOR_ASSERTION_HEADER?.trim().toLowerCase() || "x-ocrcraft-actor";
  try {
    const requestHeaders = await headers();
    const assertion = verifyActorAssertion(requestHeaders.get(headerName) ?? "", secret);
    if (assertion) return { email: assertion.email };
    const session = (await cookies()).get("ocrcraft-actor")?.value;
    const cookieAssertion = verifyActorAssertion(session ?? "", secret);
    return cookieAssertion ? { email: cookieAssertion.email } : null;
  } catch {
    return null;
  }
}

export const requireTrainer = () => requireRole("trainer");
export const requireAdmin = () => requireRole("admin");
export const requireSuperAdmin = () => requireRole("super_admin");

export async function getOptionalCurrentActor(): Promise<CurrentActor | null> {
  try { return await requireTrainer(); } catch { return null; }
}

export async function listAppUsers(): Promise<readonly AppUser[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT id::VARCHAR,email,display_name,role,active,created_at::VARCHAR,education,bio,specialties,profile_image_uri,profile_image_data,profile_image_content_type
       FROM app_users ORDER BY lower(display_name), lower(email)`,
    );
    return reader.getRows().map((row) => toUser(row));
  });
}

export async function createAppUser(input: { readonly email: string; readonly displayName: string; readonly role: UserRole; readonly password?: string }): Promise<AppUser> {
  await requireSuperAdmin();
  const email = emailSchema.parse(input.email);
  const displayName = z.string().trim().min(1).max(120).parse(input.displayName);
  const role = userRoleSchema.parse(input.role);
  const passwordHash = input.password ? hashPassword(input.password) : null;
  return withDuckDbConnection(async (connection) => {
    await connection.run(
      `INSERT INTO app_users (email,display_name,role,password_hash) VALUES ($email,$displayName,$role,$passwordHash)`,
      { email, displayName, role, passwordHash },
    );
    const reader = await connection.runAndReadAll(
      `SELECT id::VARCHAR,email,display_name,role,active,created_at::VARCHAR,education,bio,specialties,profile_image_uri,profile_image_data,profile_image_content_type FROM app_users WHERE email=$email`,
      { email },
    );
    return toUser(reader.getRows()[0]);
  });
}

export async function authenticateAppUser(emailInput: string, password: string): Promise<AppUser | null> {
  const email = emailSchema.parse(emailInput);
  if (password.length < 1 || password.length > 200) return null;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT id::VARCHAR,email,display_name,role,active,created_at::VARCHAR,education,bio,specialties,profile_image_uri,profile_image_data,profile_image_content_type,password_hash FROM app_users WHERE lower(email)=lower($email) LIMIT 1`,
      { email },
    );
    const row = reader.getRows()[0];
    if (!row || !Boolean(row[4]) || !verifyPassword(password, row[12] == null ? null : String(row[12]))) return null;
    return toUser(row);
  });
}

export async function updateAppUser(input: { readonly id: string; readonly role: UserRole; readonly active: boolean; readonly displayName: string; readonly education: string; readonly bio: string; readonly specialties: string; readonly profileImageUri: string; readonly profileImageData?: string; readonly profileImageContentType?: string }): Promise<void> {
  const actor = await requireSuperAdmin();
  const id = z.string().uuid().parse(input.id);
  const role = userRoleSchema.parse(input.role);
  const displayName = z.string().trim().min(1).max(120).parse(input.displayName);
  const education = z.string().trim().max(240).parse(input.education);
  const bio = z.string().trim().max(1000).parse(input.bio);
  const specialties = z.string().trim().max(500).parse(input.specialties);
  const profileImageUri = z.string().trim().max(500).refine((value) => !value || /^(https?:\/\/|\/)/.test(value), "Invalid profile image URI.").parse(input.profileImageUri);
  if (id === actor.id && (!input.active || role !== "super_admin")) throw new Error("Cannot demote or deactivate the current super-admin.");
  await withDuckDbConnection(async (connection) => {
    await connection.run("UPDATE app_users SET display_name=$displayName,role=$role,active=$active,education=$education,bio=$bio,specialties=$specialties,profile_image_uri=$profileImageUri,profile_image_data=COALESCE($profileImageData,profile_image_data),profile_image_content_type=COALESCE($profileImageContentType,profile_image_content_type),updated_at=current_timestamp WHERE id=$id::UUID", { id, displayName, role, active: input.active, education: education || null, bio: bio || null, specialties: specialties || null, profileImageUri: profileImageUri || null, profileImageData: input.profileImageData ?? null, profileImageContentType: input.profileImageContentType ?? null });
  });
}

function toUser(row: readonly unknown[], source: CurrentActor["source"] = "configured"): CurrentActor {
  return {
    id: String(row[0]),
    email: String(row[1]),
    displayName: String(row[2]),
    role: userRoleSchema.parse(String(row[3])),
    active: Boolean(row[4]),
    createdAt: String(row[5]),
    education: row[6] == null ? null : String(row[6]),
    bio: row[7] == null ? null : String(row[7]),
    specialties: row[8] == null ? null : String(row[8]),
    profileImageUri: row[9] == null ? null : String(row[9]),
    profileImageDataUrl: row[10] == null || row[11] == null ? null : `data:${String(row[11])};base64,${String(row[10])}`,
    source,
  };
}
