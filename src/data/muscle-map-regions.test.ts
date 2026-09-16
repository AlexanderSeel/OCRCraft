import { describe, expect, it } from "vitest";
import {
  MUSCLE_MAP_PARTS,
  MUSCLE_MAP_REFERENCE_SIZE,
  MUSCLE_MAP_VIEW_WIDTH,
} from "./muscle-map-regions";

describe("muscle map region geometry", () => {
  it("keeps every polygon inside the calibrated raster and its own body view", () => {
    for (const part of MUSCLE_MAP_PARTS) {
      expect(part.coordinates.length, part.id).toBeGreaterThanOrEqual(6);
      expect(part.coordinates.length % 2, part.id).toBe(0);

      for (let index = 0; index < part.coordinates.length; index += 2) {
        const x = part.coordinates[index];
        const y = part.coordinates[index + 1];

        expect(x, `${part.id} x`).toBeGreaterThanOrEqual(0);
        expect(x, `${part.id} x`).toBeLessThanOrEqual(MUSCLE_MAP_REFERENCE_SIZE.width);
        expect(y, `${part.id} y`).toBeGreaterThanOrEqual(0);
        expect(y, `${part.id} y`).toBeLessThanOrEqual(MUSCLE_MAP_REFERENCE_SIZE.height);

        if (part.view === "front") {
          expect(x, `${part.id} must stay in front view`).toBeLessThan(MUSCLE_MAP_VIEW_WIDTH);
        } else {
          expect(x, `${part.id} must stay in back view`).toBeGreaterThanOrEqual(MUSCLE_MAP_VIEW_WIDTH);
        }
      }
    }
  });

  it("uses stable unique ids for clickable areas", () => {
    const ids = MUSCLE_MAP_PARTS.map((part) => part.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
