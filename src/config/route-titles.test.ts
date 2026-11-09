import { expect, it } from "vitest";
import { documentTitle, routeTitle, ROUTE_TITLES } from "./route-titles";

it("uses exact routes before entity patterns and matches all declared routes", () => {
  for (const route of Object.values(ROUTE_TITLES)) {
    const pathname = route.path.replace("[id]", "example-id");
    expect(routeTitle(pathname, "de")).toBe(route.de);
    expect(routeTitle(pathname, "en")).toBe(route.en);
  }
  expect(routeTitle("/exercises/new/", "de")).toBe("Neue Übung");
  expect(routeTitle("/unknown", "en")).toBe("OCRCraft");
  expect(documentTitle("/exercises", "en")).toContain("Exercise library · OCRCraft");
});
