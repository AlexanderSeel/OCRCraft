import "server-only";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { isRoleAtLeast } from "./identity-core";
import { verifyActorAssertion } from "./identity-assertion";
import { hashPassword, verifyPassword } from "./password";
import {
  TRAINER_QUALIFICATION_LEVELS,
  type TrainerQualificationLevel,
} from "@/domain/training/trainer-qualification";

export const userRoleSchema = z.enum(["trainer", "admin", "super_admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;
export const trainerQualificationSchema = z.enum(TRAINER_QUALIFICATION_LEVELS);

export interface AppUser {
  readonly id: string;
  readonly email: string;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly active: boolean;
  readonly createdAt: string;
  readonly education: string | null;
  readonly trainerQualificationLevel: TrainerQualificationLevel;
  readonly bio: string | null;
  readonly specialties: string | null;
  readonly profileImageUri: string | null;
  readonly profileImageDataUrl: string | null;
}

export interface CurrentActor extends AppUser {
  readonly source: "configured" | "assertion" | "bootstrap";
}

const emailSchema = z.string().trim().toLowerCase().email();

const APP_USER_SELECT_COLUMNS = [
  "id::VARCHAR",
  "email",
  "display_name",
  "role",
  "active",
  "created_at::VARCHAR",
  "education",
  "bio",
  "specialties",
  "profile_image_uri",
  "profile_image_data",
  "profile_image_content_type",
  "first_name",
  "last_name",
  "username",
  "COALESCE(trainer_qualification_level,'none')",
].join(",");

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
      `SELECT ${APP_USER_SELECT_COLUMNS}
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
        `SELECT ${APP_USER_SELECT_COLUMNS}
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
      `SELECT ${APP_USER_SELECT_COLUMNS}
       FROM app_users ORDER BY lower(display_name), lower(email)`,
    );
    return reader.getRows().map((row) => toUser(row));
  });
}

export async function createAppUser(input: {
  readonly email: string;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly trainerQualificationLevel?: TrainerQualificationLevel;
  readonly password?: string;
}): Promise<AppUser> {
  await requireSuperAdmin();
  const email = emailSchema.parse(input.email);
  const firstName = z.string().trim().min(1).max(80).parse(input.firstName);
  const lastName = z.string().trim().min(1).max(80).parse(input.lastName);
  const username = z.string().trim().regex(/^[a-zA-Z0-9._-]{3,40}$/).parse(input.username);
  const displayName = `${firstName} ${lastName}`;
  const role = userRoleSchema.parse(input.role);
  const trainerQualificationLevel = trainerQualificationSchema.parse(input.trainerQualificationLevel ?? "none");
  const passwordHash = input.password ? hashPassword(input.password) : null;
  return withDuckDbConnection(async (connection) => {
    const duplicate = await connection.runAndReadAll("SELECT count(*)::INTEGER FROM app_users WHERE lower(username)=lower($username) OR lower(email)=lower($email)", { username, email });
    if (Number(duplicate.getRows()[0]?.[0] ?? 0) > 0) throw new Error("Username or email is already in use.");
    await connection.run(
      `INSERT INTO app_users (email,username,first_name,last_name,display_name,role,password_hash,trainer_qualification_level) VALUES ($email,$username,$firstName,$lastName,$displayName,$role,$passwordHash,$trainerQualificationLevel)`,
      { email, username, firstName, lastName, displayName, role, passwordHash, trainerQualificationLevel },
    );
    const reader = await connection.runAndReadAll(
      `SELECT ${APP_USER_SELECT_COLUMNS} FROM app_users WHERE email=$email`,
      { email },
    );
    return toUser(reader.getRows()[0]);
  });
}

export async function authenticateAppUser(identityInput: string, password: string): Promise<AppUser | null> {
  const identity = z.string().trim().min(1).max(200).parse(identityInput);
  if (password.length < 1 || password.length > 200) return null;
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT ${APP_USER_SELECT_COLUMNS},password_hash FROM app_users WHERE lower(email)=lower($identity) OR lower(username)=lower($identity) LIMIT 1`,
      { identity },
    );
    const row = reader.getRows()[0];
    if (!row || !Boolean(row[4]) || !verifyPassword(password, row[16] == null ? null : String(row[16]))) return null;
    return toUser(row);
  });
}

export async function updateAppUser(input: {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly active: boolean;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly education: string;
  readonly trainerQualificationLevel: TrainerQualificationLevel;
  readonly bio: string;
  readonly specialties: string;
  readonly profileImageUri: string;
  readonly profileImageData?: string;
  readonly profileImageContentType?: string;
}): Promise<void> {
  const actor = await requireSuperAdmin();
  const id = z.string().uuid().parse(input.id);
  const email = emailSchema.parse(input.email);
  const role = userRoleSchema.parse(input.role);
  const firstName = z.string().trim().min(1).max(80).parse(input.firstName);
  const lastName = z.string().trim().min(1).max(80).parse(input.lastName);
  const username = z.string().trim().regex(/^[a-zA-Z0-9._-]{3,40}$/).parse(input.username);
  const displayName = `${firstName} ${lastName}`;
  const education = z.string().trim().max(240).parse(input.education);
  const trainerQualificationLevel = trainerQualificationSchema.parse(input.trainerQualificationLevel);
  const bio = z.string().trim().max(1000).parse(input.bio);
  const specialties = z.string().trim().max(500).parse(input.specialties);
  const profileImageUri = z.string().trim().max(500).refine((value) => !value || /^(https?:\/\/|\/)/.test(value), "Invalid profile image URI.").parse(input.profileImageUri);
  if (id === actor.id && (!input.active || role !== "super_admin")) throw new Error("Cannot demote or deactivate the current super-admin.");
  await withDuckDbConnection(async (connection) => {
    const duplicate = await connection.runAndReadAll("SELECT count(*)::INTEGER FROM app_users WHERE id<>$id::UUID AND (lower(username)=lower($username) OR lower(email)=lower($email))", { id, username, email });
    if (Number(duplicate.getRows()[0]?.[0] ?? 0) > 0) throw new Error("Username or email is already in use.");
    await connection.run("UPDATE app_users SET email=$email,username=$username,first_name=$firstName,last_name=$lastName,display_name=$displayName,role=$role,active=$active,education=$education,trainer_qualification_level=$trainerQualificationLevel,bio=$bio,specialties=$specialties,profile_image_uri=$profileImageUri,profile_image_data=COALESCE($profileImageData,profile_image_data),profile_image_content_type=COALESCE($profileImageContentType,profile_image_content_type),updated_at=current_timestamp WHERE id=$id::UUID", { id, email, username, firstName, lastName, displayName, role, active: input.active, education: education || null, trainerQualificationLevel, bio: bio || null, specialties: specialties || null, profileImageUri: profileImageUri || null, profileImageData: input.profileImageData ?? null, profileImageContentType: input.profileImageContentType ?? null });
  });
}

export async function setAppUserPassword(userId: string, password: string): Promise<void> {
  await requireSuperAdmin();
  const id = z.string().uuid().parse(userId);
  const passwordHash = hashPassword(z.string().min(8).max(200).parse(password));
  await withDuckDbConnection((connection) => connection.run(
    "UPDATE app_users SET password_hash=$passwordHash,updated_at=current_timestamp WHERE id=$id::UUID",
    { id, passwordHash },
  ));
}

export async function deleteAppUser(userId: string): Promise<void> {
  const actor = await requireSuperAdmin();
  const id = z.string().uuid().parse(userId);
  if (id === actor.id) throw new Error("Cannot delete the current super-admin.");
  await withDuckDbConnection(async (connection) => {
    await connection.run("DELETE FROM app_user_roles WHERE user_id=$id::UUID", { id });
    await connection.run("DELETE FROM app_users WHERE id=$id::UUID", { id });
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
    trainerQualificationLevel: trainerQualificationSchema.parse(String(row[15] ?? "none")),
    bio: row[7] == null ? null : String(row[7]),
    specialties: row[8] == null ? null : String(row[8]),
    profileImageUri: row[9] == null ? null : String(row[9]),
    profileImageDataUrl: row[10] == null || row[11] == null ? null : `data:${String(row[11])};base64,${String(row[10])}`,
    firstName: row[12] == null ? String(row[2]).split(/\s+/)[0] : String(row[12]),
    lastName: row[13] == null ? String(row[2]).split(/\s+/).slice(1).join(" ") : String(row[13]),
    username: row[14] == null ? String(row[1]).split("@")[0] : String(row[14]),
    source,
  };
}
