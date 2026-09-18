import { describe, expect, it } from "vitest";
import { isRoleAtLeast } from "./identity-core";

describe("identity role hierarchy", () => {
  it("allows higher roles to perform lower-level actions", () => {
    expect(isRoleAtLeast("super_admin", "admin")).toBe(true);
    expect(isRoleAtLeast("admin", "trainer")).toBe(true);
    expect(isRoleAtLeast("trainer", "admin")).toBe(false);
  });
});
