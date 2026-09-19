import { z } from "zod";

export const PERMISSION_RESOURCES = [
  "training",
  "exercises",
  "groups",
  "games",
  "obstacles",
  "media",
  "reports",
  "administration",
] as const;

export const PERMISSION_LEVELS = ["read", "write", "admin"] as const;

export const permissionResourceSchema = z.enum(PERMISSION_RESOURCES);
export const permissionLevelSchema = z.enum(PERMISSION_LEVELS);
export type PermissionResource = z.infer<typeof permissionResourceSchema>;
export type PermissionLevel = z.infer<typeof permissionLevelSchema>;

export interface PermissionGrant {
  readonly resource: PermissionResource;
  readonly level: PermissionLevel;
}

const levelRank: Record<PermissionLevel, number> = { read: 1, write: 2, admin: 3 };

export function permissionIncludes(
  grants: readonly PermissionGrant[],
  required: PermissionGrant,
): boolean {
  return grants.some(
    (grant) => grant.resource === required.resource && levelRank[grant.level] >= levelRank[required.level],
  );
}

export function normalizePermissionGrants(grants: readonly PermissionGrant[]): readonly PermissionGrant[] {
  const unique = new Map<string, PermissionGrant>();
  for (const grant of grants) {
    const parsed = { resource: permissionResourceSchema.parse(grant.resource), level: permissionLevelSchema.parse(grant.level) };
    const key = `${parsed.resource}:${parsed.level}`;
    unique.set(key, parsed);
  }
  return [...unique.values()].sort((left, right) => `${left.resource}:${left.level}`.localeCompare(`${right.resource}:${right.level}`));
}

export function grantsForBuiltInRole(role: "trainer" | "admin" | "super_admin"): readonly PermissionGrant[] {
  if (role === "super_admin") return PERMISSION_RESOURCES.flatMap((resource) => [{ resource, level: "admin" as const }]);
  if (role === "admin") return PERMISSION_RESOURCES.flatMap((resource) => [{ resource, level: "write" as const }]);
  return [
    { resource: "training", level: "write" },
    { resource: "exercises", level: "write" },
    { resource: "groups", level: "write" },
    { resource: "games", level: "write" },
    { resource: "obstacles", level: "write" },
    { resource: "media", level: "read" },
    { resource: "reports", level: "read" },
  ];
}
