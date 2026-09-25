import "server-only";

import { z } from "zod";
import { normalizePermissionGrants, permissionLevelSchema, permissionResourceSchema, type PermissionGrant } from "@/domain/auth/permissions";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { recordAuditEvent } from "@/server/db/audit-service";
import { requireSuperAdmin } from "./identity-service";

export interface AccessRole {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  readonly active: boolean;
  readonly permissions: readonly PermissionGrant[];
}

const roleKeySchema = z.string().trim().regex(/^[a-z][a-z0-9_-]{2,48}$/);
const textSchema = z.string().trim().min(1).max(160);

export async function listAccessRoles(): Promise<readonly AccessRole[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`SELECT r.id::VARCHAR,r.role_key,r.name,r.description,r.active,p.resource,p.access_level FROM app_roles r LEFT JOIN app_role_permissions p ON p.role_id=r.id ORDER BY lower(r.name),p.resource,p.access_level`);
    const roles = new Map<string, AccessRole>();
    for (const row of reader.getRows()) {
      const id = String(row[0]);
      const current = roles.get(id) ?? { id, key: String(row[1]), name: String(row[2]), description: row[3] == null ? null : String(row[3]), active: Boolean(row[4]), permissions: [] };
      if (row[5] != null && row[6] != null) (current.permissions as PermissionGrant[]).push({ resource: permissionResourceSchema.parse(String(row[5])), level: permissionLevelSchema.parse(String(row[6])) });
      roles.set(id, current);
    }
    return [...roles.values()].map((role) => ({ ...role, permissions: normalizePermissionGrants(role.permissions) }));
  });
}

export async function listUserRoleAssignments(): Promise<Readonly<Record<string, readonly string[]>>> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll("SELECT user_id::VARCHAR,role_id::VARCHAR FROM app_user_roles ORDER BY user_id,role_id");
    const assignments: Record<string, string[]> = {};
    for (const row of reader.getRows()) (assignments[String(row[0])] ??= []).push(String(row[1]));
    return assignments;
  });
}

export async function createAccessRole(input: { readonly key: string; readonly name: string; readonly description: string; readonly permissions: readonly PermissionGrant[] }): Promise<void> {
  const actor = await requireSuperAdmin();
  const key = roleKeySchema.parse(input.key);
  const name = textSchema.parse(input.name);
  const description = z.string().trim().max(500).parse(input.description);
  const permissions = normalizePermissionGrants(input.permissions);
  let roleId = "";
  await withDuckDbConnection(async (connection) => {
    const result = await connection.runAndReadAll("INSERT INTO app_roles (role_key,name,description) VALUES ($key,$name,$description) RETURNING id::VARCHAR", { key, name, description: description || null });
    roleId = String(result.getRows()[0]?.[0]);
    for (const permission of permissions) await connection.run("INSERT INTO app_role_permissions (role_id,resource,access_level) VALUES ($roleId::UUID,$resource,$level)", { roleId, resource: permission.resource, level: permission.level });
  });
  await recordAuditEvent({ action: "role.created", entityType: "role", entityId: roleId, actorType: "user", actorId: actor.id });
}

export async function updateAccessRole(input: { readonly id: string; readonly name: string; readonly description: string; readonly active: boolean; readonly permissions: readonly PermissionGrant[] }): Promise<void> {
  const actor = await requireSuperAdmin();
  const id = z.string().uuid().parse(input.id);
  const name = textSchema.parse(input.name);
  const description = z.string().trim().max(500).parse(input.description);
  const permissions = normalizePermissionGrants(input.permissions);
  await withDuckDbConnection(async (connection) => {
    await connection.run("UPDATE app_roles SET name=$name,description=$description,active=$active,updated_at=current_timestamp WHERE id=$id::UUID", { id, name, description: description || null, active: input.active });
    await connection.run("DELETE FROM app_role_permissions WHERE role_id=$id::UUID", { id });
    for (const permission of permissions) await connection.run("INSERT INTO app_role_permissions (role_id,resource,access_level) VALUES ($id::UUID,$resource,$level)", { id, resource: permission.resource, level: permission.level });
  });
  await recordAuditEvent({ action: "role.updated", entityType: "role", entityId: id, actorType: "user", actorId: actor.id });
}

export async function deleteAccessRole(roleId: string): Promise<void> {
  const actor = await requireSuperAdmin();
  const id = z.string().uuid().parse(roleId);
  await withDuckDbConnection(async (connection) => {
    await connection.run("DELETE FROM app_user_roles WHERE role_id=$id::UUID", { id });
    await connection.run("DELETE FROM app_roles WHERE id=$id::UUID", { id });
  });
  await recordAuditEvent({ action: "role.deleted", entityType: "role", entityId: id, actorType: "user", actorId: actor.id });
}

export async function assignAccessRoles(input: { readonly userId: string; readonly roleIds: readonly string[] }): Promise<void> {
  const actor = await requireSuperAdmin();
  const userId = z.string().uuid().parse(input.userId);
  const roleIds = [...new Set(input.roleIds.map((id) => z.string().uuid().parse(id)))];
  await withDuckDbConnection(async (connection) => {
    await connection.run("DELETE FROM app_user_roles WHERE user_id=$userId::UUID", { userId });
    for (const roleId of roleIds) await connection.run("INSERT INTO app_user_roles (user_id,role_id,assigned_by) VALUES ($userId::UUID,$roleId::UUID,$actorId::UUID)", { userId, roleId, actorId: actor.id });
  });
  await recordAuditEvent({ action: "role.assignment.updated", entityType: "user", entityId: userId, actorType: "user", actorId: actor.id });
}
