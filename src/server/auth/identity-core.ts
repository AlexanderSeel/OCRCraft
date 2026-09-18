import type { UserRole } from "./identity-service";

const roleRank: Record<UserRole, number> = { trainer: 1, admin: 2, super_admin: 3 };

export function isRoleAtLeast(actual: UserRole, required: UserRole): boolean {
  return roleRank[actual] >= roleRank[required];
}
