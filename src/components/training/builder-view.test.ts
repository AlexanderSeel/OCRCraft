import { expect, it } from "vitest";
import { resolveBuilderView } from "./builder-view";

it("keeps existing source and engine links on the detailed planner while defaulting to quick", () => {
  expect(resolveBuilderView({})).toBe("quick");
  expect(resolveBuilderView({ planner: "unknown", mode: "unknown" })).toBe("quick");
  expect(resolveBuilderView({ source: "session-id" })).toBe("detailed");
  expect(resolveBuilderView({ mode: "ai" })).toBe("detailed");
  expect(resolveBuilderView({ mode: "local" })).toBe("detailed");
  expect(resolveBuilderView({ planner: "quick", mode: "ai", source: "session-id" })).toBe("quick");
  expect(resolveBuilderView({ planner: "detailed" })).toBe("detailed");
});
