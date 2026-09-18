import "server-only";

import { z } from "zod";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { isRoleAtLeast } from "./identity-core";

export const userRoleSchema = z.enum(["trainer", "admin", "super_admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export interface AppUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly active: boolean;
  readonly createdAt: string;
}

export interface CurrentActor extends AppUser {
  readonly source: "configured" | "bootstrap";
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
  const authRequired = process.env.OCRCRAFT_AUTH_REQUIRED === "1";
  const email = configuredEmail ?? "owner@ocrcraft.local";

  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT id::VARCHAR,email,display_name,role,active,created_at::VARCHAR
       FROM app_users WHERE lower(email)=lower($email) LIMIT 1`,
      { email },
    );
    let row = reader.getRows()[0];
    let source: CurrentActor["source"] = "configured";

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

export const requireTrainer = () => requireRole("trainer");
export const requireAdmin = () => requireRole("admin");
export const requireSuperAdmin = () => requireRole("super_admin");

export async function listAppUsers(): Promise<readonly AppUser[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `SELECT id::VARCHAR,email,display_name,role,active,created_at::VARCHAR
       FROM app_users ORDER BY lower(display_name), lower(email)`,
    );
    return reader.getRows().map((row) => toUser(row));
  });
}

export async function createAppUser(input: { readonly email: string; readonly displayName: string; readonly role: UserRole }): Promise<AppUser> {
  await requireSuperAdmin();
  const email = emailSchema.parse(input.email);
  const displayName = z.string().trim().min(1).max(120).parse(input.displayName);
  const role = userRoleSchema.parse(input.role);
  return withDuckDbConnection(async (connection) => {
    await connection.run(
      `INSERT INTO app_users (email,display_name,role) VALUES ($email,$displayName,$role)`,
      { email, displayName, role },
    );
    const reader = await connection.runAndReadAll(
      `SELECT id::VARCHAR,email,display_name,role,active,created_at::VARCHAR FROM app_users WHERE email=$email`,
      { email },
    );
    return toUser(reader.getRows()[0]);
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
    source,
  };
}
