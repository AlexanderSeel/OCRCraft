import { describe, expect, it } from "vitest";
import { grantsForBuiltInRole, permissionIncludes, normalizePermissionGrants } from "@/domain/auth/permissions";

describe("permission grants", () => {
  it("treats higher access as satisfying lower access", () => {
    expect(permissionIncludes([{ resource: "training", level: "admin" }], { resource: "training", level: "write" })).toBe(true);
    expect(permissionIncludes([{ resource: "training", level: "read" }], { resource: "training", level: "write" })).toBe(false);
  });

  it("deduplicates grants and keeps built-in safety defaults", () => {
    expect(normalizePermissionGrants([{ resource: "media", level: "read" }, { resource: "media", level: "read" }])).toHaveLength(1);
    expect(grantsForBuiltInRole("trainer")).toContainEqual({ resource: "training", level: "write" });
    expect(grantsForBuiltInRole("admin")).toContainEqual({ resource: "administration", level: "write" });
  });
});
