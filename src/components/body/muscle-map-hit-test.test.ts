import { describe, expect, it } from "vitest";
import type { MuscleMapPart } from "@/data/muscle-map-regions";
import {
  clientPointToMuscleMapPoint,
  findMuscleMapPartAtPoint,
  pointInPolygon,
} from "./muscle-map-hit-test";

function part(id: string, coordinates: readonly number[]): MuscleMapPart {
  return {
    id,
    optionId: id,
    labelDe: id,
    view: "front",
    side: "center",
    coordinates,
  };
}

describe("muscle map hit testing", () => {
  it("maps client coordinates into the original raster coordinate system", () => {
    expect(clientPointToMuscleMapPoint(200, 252, {
      left: 12,
      top: 0,
      width: 376,
      height: 504,
    }, 376, 504)).toEqual({ x: 188, y: 252 });
  });

  it("detects whether a point is inside a polygon", () => {
    const square = [10, 10, 30, 10, 30, 30, 10, 30];
    expect(pointInPolygon(20, 20, square)).toBe(true);
    expect(pointInPolygon(5, 20, square)).toBe(false);
  });

  it("prefers the smallest overlapping region for precise muscle selection", () => {
    const broad = part("broad", [0, 0, 100, 0, 100, 100, 0, 100]);
    const precise = part("precise", [40, 40, 60, 40, 60, 60, 40, 60]);

    expect(findMuscleMapPartAtPoint([broad, precise], { x: 50, y: 50 })?.id).toBe("precise");
    expect(findMuscleMapPartAtPoint([broad, precise], { x: 10, y: 10 })?.id).toBe("broad");
  });
});
