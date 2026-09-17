import { describe, expect, it } from "vitest";
import { BODY_REGION_IDS, COARSE_BODY_REGION_IDS, DETAIL_BODY_REGION_OPTIONS, bodyRegionsOverlap, normalizeBodyRegionId } from "./body-regions";
import { MUSCLE_MAP_PARTS } from "../data/muscle-map-regions";
import { findMuscleMapPartAtPoint, polygonArea } from "../components/body/muscle-map-hit-test";
import source from "../../vendor/body-muscles/paths.json";
import landmarks from "../../vendor/body-muscles/reported-landmarks.json";

describe("detailed anatomical map", () => {
  it("preserves 24 groups and registers every pinned source region once", () => {
    expect(COARSE_BODY_REGION_IDS).toHaveLength(24);
    expect(DETAIL_BODY_REGION_OPTIONS).toHaveLength(89);
    expect(new Set(BODY_REGION_IDS).size).toBe(113);
    expect(DETAIL_BODY_REGION_OPTIONS.map(d => d.sourceId).sort()).toEqual(source.map(d => d.id).sort());
    for (const detail of DETAIL_BODY_REGION_OPTIONS) {
      expect(COARSE_BODY_REGION_IDS).toContain(detail.parentId);
      expect(normalizeBodyRegionId(detail.id)).toBe(detail.id);
      expect(MUSCLE_MAP_PARTS.some(p => p.optionId === detail.id && polygonArea(p.coordinates) > 0)).toBe(true);
    }
  });
  it("keeps all polygons inside the reference frame", () => {
    for (const part of MUSCLE_MAP_PARTS) for (let i = 0; i < part.coordinates.length; i++) {
      expect(part.coordinates[i]).toBeGreaterThanOrEqual(0);
      expect(part.coordinates[i]).toBeLessThanOrEqual(i % 2 ? 504 : 376);
    }
  });
  it("covers the trainer-reported missing surface points", () => {
    for (const [sourceId, points] of Object.entries(landmarks)) for (const [x, y] of points) {
      const hit = findMuscleMapPartAtPoint(MUSCLE_MAP_PARTS, { x, y });
      expect(hit, `${sourceId} at ${x}/${y}`).not.toBeNull();
    }
  });
  it("allows a pointer to reach every individual detail region", () => {
    const reachable = new Set<string>();
    for (let y = 0.5; y < 504; y += 1) for (let x = 0.5; x < 376; x += 1) {
      const hit = findMuscleMapPartAtPoint(MUSCLE_MAP_PARTS, { x, y });
      if (hit) reachable.add(hit.optionId);
    }
    expect(DETAIL_BODY_REGION_OPTIONS.filter(d => !reachable.has(d.id)).map(d => d.id)).toEqual([]);
  });
  it("finds coarse records but never infers an opposite side or sibling muscle head", () => {
    expect(bodyRegionsOverlap(["biceps"], ["detail:biceps-left"])).toBe(true);
    expect(bodyRegionsOverlap(["detail:biceps-left"], ["biceps"])).toBe(true);
    expect(bodyRegionsOverlap(["detail:biceps-left"], ["detail:biceps-right"])).toBe(false);
    expect(bodyRegionsOverlap(["detail:calves-soleus-left"], ["detail:calves-gastroc-medial-left"])).toBe(false);
    expect(bodyRegionsOverlap(["biceps"], ["detail:elbow-left"])).toBe(false);
  });
});
