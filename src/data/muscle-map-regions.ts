import detailParts from "./muscle-map-detail-parts.json";
export const MUSCLE_MAP_REFERENCE_SIZE = { width: 376, height: 504 } as const;
export const MUSCLE_MAP_VIEW_WIDTH = MUSCLE_MAP_REFERENCE_SIZE.width / 2;

export type MuscleMapView = "front" | "back";
export type MuscleMapSide = "left" | "right" | "center";

export interface MuscleMapPart {
  readonly id: string;
  readonly optionId: string;
  readonly labelDe: string;
  readonly view: MuscleMapView;
  readonly side: MuscleMapSide;
  /** Polygon points in the combined 376x504 raster coordinate system. */
  readonly coordinates: readonly number[];
}

// Detail polygons supply the same geometry to highlighting and hit testing.
export const MUSCLE_MAP_PARTS: readonly MuscleMapPart[] = detailParts.map(part => ({
  ...part, view: part.view as MuscleMapView, side: part.side as MuscleMapSide,
}));

export const MUSCLE_MAP_PARTS_BY_OPTION = new Map<string, readonly MuscleMapPart[]>(
  [...new Set(MUSCLE_MAP_PARTS.map((part) => part.optionId))].map((optionId) => [
    optionId,
    MUSCLE_MAP_PARTS.filter((part) => part.optionId === optionId),
  ]),
);

export function polygonToClipPath(coordinates: readonly number[]): string {
  const { width, height } = MUSCLE_MAP_REFERENCE_SIZE;
  const points: string[] = [];
  for (let index = 0; index < coordinates.length; index += 2) {
    points.push(`${(coordinates[index] / width) * 100}% ${(coordinates[index + 1] / height) * 100}%`);
  }
  return `polygon(${points.join(",")})`;
}
