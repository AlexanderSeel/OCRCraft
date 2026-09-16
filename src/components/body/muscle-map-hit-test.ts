import type { MuscleMapPart } from "@/data/muscle-map-regions";

export interface MuscleMapPoint {
  readonly x: number;
  readonly y: number;
}

export interface MuscleMapRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export function clientPointToMuscleMapPoint(
  clientX: number,
  clientY: number,
  rect: MuscleMapRect,
  referenceWidth: number,
  referenceHeight: number,
): MuscleMapPoint | null {
  if (rect.width <= 0 || rect.height <= 0) return null;

  const x = ((clientX - rect.left) / rect.width) * referenceWidth;
  const y = ((clientY - rect.top) / rect.height) * referenceHeight;

  if (x < 0 || y < 0 || x > referenceWidth || y > referenceHeight) return null;
  return { x, y };
}

export function pointInPolygon(
  x: number,
  y: number,
  coordinates: readonly number[],
): boolean {
  if (coordinates.length < 6 || coordinates.length % 2 !== 0) return false;

  let inside = false;
  const pointCount = coordinates.length / 2;

  for (let current = 0, previous = pointCount - 1; current < pointCount; previous = current++) {
    const currentX = coordinates[current * 2];
    const currentY = coordinates[current * 2 + 1];
    const previousX = coordinates[previous * 2];
    const previousY = coordinates[previous * 2 + 1];

    const crossesRay = (currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;

    if (crossesRay) inside = !inside;
  }

  return inside;
}

export function polygonArea(coordinates: readonly number[]): number {
  if (coordinates.length < 6 || coordinates.length % 2 !== 0) return Number.POSITIVE_INFINITY;

  let area = 0;
  const pointCount = coordinates.length / 2;
  for (let index = 0; index < pointCount; index += 1) {
    const next = (index + 1) % pointCount;
    const x1 = coordinates[index * 2];
    const y1 = coordinates[index * 2 + 1];
    const x2 = coordinates[next * 2];
    const y2 = coordinates[next * 2 + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

/**
 * Finds the most precise muscle under a pointer. If polygons overlap, the
 * smallest containing polygon wins so a specific muscle beats a broader area.
 */
export function findMuscleMapPartAtPoint(
  parts: readonly MuscleMapPart[],
  point: MuscleMapPoint,
): MuscleMapPart | null {
  let best: MuscleMapPart | null = null;
  let bestArea = Number.POSITIVE_INFINITY;

  for (const part of parts) {
    if (!pointInPolygon(point.x, point.y, part.coordinates)) continue;
    const area = polygonArea(part.coordinates);
    if (area < bestArea) {
      best = part;
      bestArea = area;
    }
  }

  return best;
}
