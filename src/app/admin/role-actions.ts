"use server";

import { redirect } from "next/navigation";
import { permissionLevelSchema, permissionResourceSchema, type PermissionGrant } from "@/domain/auth/permissions";
import { assignAccessRoles, createAccessRole, deleteAccessRole, updateAccessRole } from "@/server/auth/permission-service";

function grants(formData: FormData): readonly PermissionGrant[] {
  return formData.getAll("permission").map(String).map((value) => { const [resource, level] = value.split(":"); return { resource: permissionResourceSchema.parse(resource), level: permissionLevelSchema.parse(level) }; });
}

export async function createRoleAction(formData: FormData): Promise<void> { try { await createAccessRole({ key: String(formData.get("key") ?? ""), name: String(formData.get("name") ?? ""), description: String(formData.get("description") ?? ""), permissions: grants(formData) }); } catch { redirect("/admin?tab=roles&roleError=1"); } redirect("/admin?tab=roles&roleSaved=1"); }
export async function updateRoleAction(formData: FormData): Promise<void> { try { await updateAccessRole({ id: String(formData.get("id") ?? ""), name: String(formData.get("name") ?? ""), description: String(formData.get("description") ?? ""), active: formData.get("active") === "on", permissions: grants(formData) }); } catch { redirect("/admin?tab=roles&roleError=1"); } redirect("/admin?tab=roles&roleSaved=1"); }
export async function deleteRoleAction(formData: FormData): Promise<void> { try { await deleteAccessRole(String(formData.get("id") ?? "")); } catch { redirect("/admin?tab=roles&roleError=1"); } redirect("/admin?tab=roles&roleSaved=deleted"); }
export async function assignRoleAction(formData: FormData): Promise<void> { try { await assignAccessRoles({ userId: String(formData.get("userId") ?? ""), roleIds: formData.getAll("roleId").map(String) }); } catch { redirect("/admin?tab=roles&roleError=1"); } redirect("/admin?tab=roles&roleSaved=assigned"); }
