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

const VIEW_X_OFFSET: Readonly<Record<MuscleMapView, number>> = {
  front: 0,
  back: MUSCLE_MAP_VIEW_WIDTH,
};

function toReferenceCoordinates(
  view: MuscleMapView,
  localCoordinates: readonly number[],
): readonly number[] {
  const offsetX = VIEW_X_OFFSET[view];
  return localCoordinates.map((value, index) => (
    index % 2 === 0 ? value + offsetX : value
  ));
}

function region(
  id: string,
  optionId: string,
  labelDe: string,
  view: MuscleMapView,
  side: MuscleMapSide,
  localCoordinates: readonly number[],
): MuscleMapPart {
  return {
    id,
    optionId,
    labelDe,
    view,
    side,
    coordinates: toReferenceCoordinates(view, localCoordinates),
  };
}

/**
 * Click/highlight polygons calibrated against the checked-in 376x504 raster.
 *
 * Coordinates below are intentionally local to each 188px-wide body view.
 * Keeping front/back coordinates local makes the map maintainable and prevents
 * a hotspot from drifting into the other half when the raster is replaced.
 */
export const MUSCLE_MAP_PARTS: readonly MuscleMapPart[] = [
  region("neck-front", "neck", "Nacken", "front", "center", [84, 61, 108, 61, 113, 80, 109, 99, 96, 105, 83, 99, 79, 80]),
  region("traps-front", "traps", "Trapezmuskel", "front", "center", [58, 88, 79, 83, 88, 95, 96, 102, 104, 95, 113, 83, 136, 88, 128, 102, 110, 111, 96, 108, 82, 111, 64, 102]),
  region("deltoid-front-right", "shoulders", "Schulter rechts", "front", "right", [32, 108, 39, 99, 50, 95, 60, 101, 64, 112, 62, 128, 55, 139, 45, 141, 37, 132]),
  region("deltoid-front-left", "shoulders", "Schulter links", "front", "left", [128, 112, 132, 101, 142, 95, 153, 99, 160, 108, 155, 132, 147, 141, 137, 139, 130, 128]),
  region("pectoralis-right", "chest", "Brust rechts", "front", "right", [55, 110, 73, 105, 95, 107, 95, 143, 80, 147, 64, 143, 54, 133]),
  region("pectoralis-left", "chest", "Brust links", "front", "left", [97, 107, 119, 105, 137, 110, 138, 133, 128, 143, 112, 147, 97, 143]),
  region("biceps-right", "biceps", "Bizeps rechts", "front", "right", [36, 139, 47, 136, 55, 145, 56, 162, 52, 181, 44, 190, 36, 181, 33, 161]),
  region("biceps-left", "biceps", "Bizeps links", "front", "left", [136, 145, 144, 136, 155, 139, 159, 161, 156, 181, 148, 190, 140, 181, 136, 162]),
  region("forearm-front-right", "forearms-grip", "Unterarm rechts", "front", "right", [31, 179, 42, 181, 47, 201, 44, 224, 38, 247, 29, 257, 21, 246, 18, 225, 23, 201]),
  region("forearm-front-left", "forearms-grip", "Unterarm links", "front", "left", [150, 181, 161, 179, 169, 201, 174, 225, 171, 246, 163, 257, 154, 247, 148, 224, 145, 201]),
  region("abdominals", "abs", "Bauchmuskulatur", "front", "center", [78, 145, 114, 145, 117, 166, 116, 191, 115, 214, 107, 229, 96, 237, 85, 229, 77, 214, 76, 191, 75, 166]),
  region("obliques-right", "obliques", "Seitlicher Core rechts", "front", "right", [57, 148, 77, 145, 79, 170, 77, 195, 81, 218, 72, 236, 62, 224, 56, 205, 54, 181]),
  region("obliques-left", "obliques", "Seitlicher Core links", "front", "left", [115, 145, 135, 148, 138, 181, 136, 205, 130, 224, 120, 236, 111, 218, 115, 195, 113, 170]),
  region("hips-right", "hips", "Hüfte rechts", "front", "right", [58, 216, 78, 218, 92, 235, 92, 258, 82, 269, 67, 263, 58, 248]),
  region("hips-left", "hips", "Hüfte links", "front", "left", [100, 235, 114, 218, 134, 216, 134, 248, 125, 263, 110, 269, 100, 258]),
  region("quadriceps-right", "quadriceps", "Quadrizeps rechts", "front", "right", [54, 260, 74, 256, 89, 262, 94, 285, 93, 311, 87, 335, 77, 347, 65, 340, 58, 323, 54, 297]),
  region("quadriceps-left", "quadriceps", "Quadrizeps links", "front", "left", [98, 285, 103, 262, 118, 256, 138, 260, 138, 297, 134, 323, 127, 340, 115, 347, 105, 335, 99, 311]),
  region("adductors-right", "adductors", "Adduktoren rechts", "front", "right", [79, 262, 91, 263, 96, 282, 95, 307, 91, 331, 84, 341, 78, 322, 75, 296]),
  region("adductors-left", "adductors", "Adduktoren links", "front", "left", [97, 282, 101, 263, 113, 262, 117, 296, 114, 322, 108, 341, 101, 331, 97, 307]),
  region("tibialis-right", "tibialis", "Tibialis rechts", "front", "right", [58, 345, 72, 343, 83, 354, 85, 377, 82, 406, 78, 435, 73, 456, 66, 457, 61, 438, 57, 409]),
  region("tibialis-left", "tibialis", "Tibialis links", "front", "left", [109, 354, 120, 343, 134, 345, 135, 409, 131, 438, 126, 457, 119, 456, 114, 435, 110, 406, 107, 377]),
  region("feet-front-right", "ankles-feet", "Fuß rechts", "front", "right", [57, 455, 73, 453, 84, 461, 91, 476, 87, 489, 72, 495, 58, 490, 52, 480]),
  region("feet-front-left", "ankles-feet", "Fuß links", "front", "left", [108, 461, 119, 453, 135, 455, 140, 480, 134, 490, 120, 495, 105, 489, 101, 476]),

  region("neck-back", "neck", "Nacken", "back", "center", [78, 55, 110, 55, 113, 76, 108, 96, 94, 106, 80, 96, 75, 76]),
  region("trapezius", "traps", "Trapezmuskel", "back", "center", [50, 88, 72, 83, 94, 96, 116, 83, 138, 88, 132, 107, 119, 124, 108, 145, 94, 160, 80, 145, 69, 124, 56, 107]),
  region("rear-deltoid-right", "rear-delts", "Hintere Schulter rechts", "back", "right", [34, 108, 42, 99, 54, 96, 65, 103, 68, 115, 64, 130, 56, 140, 45, 141, 37, 132]),
  region("rear-deltoid-left", "rear-delts", "Hintere Schulter links", "back", "left", [123, 103, 134, 96, 146, 99, 154, 108, 151, 132, 143, 141, 132, 140, 124, 130, 120, 115]),
  region("rhomboids", "upper-back", "Oberer Rücken", "back", "center", [65, 108, 82, 102, 94, 108, 106, 102, 123, 108, 118, 132, 108, 151, 94, 165, 80, 151, 70, 132]),
  region("latissimus-right", "lats", "Latissimus rechts", "back", "right", [50, 137, 66, 133, 82, 143, 88, 166, 85, 191, 78, 213, 67, 225, 57, 215, 52, 195, 48, 167]),
  region("latissimus-left", "lats", "Latissimus links", "back", "left", [100, 143, 116, 133, 132, 137, 140, 167, 136, 195, 131, 215, 121, 225, 110, 213, 103, 191, 100, 166]),
  region("triceps-right", "triceps", "Trizeps rechts", "back", "right", [34, 142, 44, 139, 53, 149, 55, 166, 51, 184, 44, 193, 37, 184, 33, 165]),
  region("triceps-left", "triceps", "Trizeps links", "back", "left", [135, 149, 144, 139, 154, 142, 155, 165, 151, 184, 144, 193, 137, 184, 133, 166]),
  region("forearm-back-right", "forearms-grip", "Unterarm rechts", "back", "right", [23, 181, 34, 180, 42, 198, 44, 219, 40, 242, 33, 257, 25, 253, 19, 235, 18, 211]),
  region("forearm-back-left", "forearms-grip", "Unterarm links", "back", "left", [146, 198, 154, 180, 165, 181, 170, 211, 169, 235, 163, 253, 155, 257, 148, 242, 144, 219]),
  region("erector-spinae", "lower-back", "Rückenstrecker", "back", "center", [76, 154, 87, 146, 94, 154, 101, 146, 112, 154, 113, 184, 108, 211, 101, 226, 94, 233, 87, 226, 80, 211, 75, 184]),
  region("glute-right", "glutes", "Gesäß rechts", "back", "right", [52, 216, 73, 211, 94, 219, 94, 261, 82, 273, 65, 271, 53, 260, 48, 239]),
  region("glute-left", "glutes", "Gesäß links", "back", "left", [94, 219, 115, 211, 136, 216, 140, 239, 135, 260, 123, 271, 106, 273, 94, 261]),
  region("hamstrings-right", "hamstrings", "Hamstrings rechts", "back", "right", [55, 268, 72, 266, 88, 273, 92, 296, 89, 322, 83, 345, 73, 354, 62, 346, 56, 324, 53, 296]),
  region("hamstrings-left", "hamstrings", "Hamstrings links", "back", "left", [100, 273, 116, 266, 133, 268, 135, 296, 132, 324, 126, 346, 115, 354, 105, 345, 99, 322, 96, 296]),
  region("calf-right", "calves", "Wade rechts", "back", "right", [56, 348, 69, 343, 83, 350, 88, 368, 86, 392, 79, 414, 70, 423, 61, 416, 55, 395, 52, 372]),
  region("calf-left", "calves", "Wade links", "back", "left", [105, 350, 119, 343, 132, 348, 136, 372, 133, 395, 127, 416, 118, 423, 109, 414, 102, 392, 100, 368]),
  region("feet-back-right", "ankles-feet", "Fuß rechts", "back", "right", [52, 448, 67, 447, 78, 457, 88, 474, 84, 487, 70, 493, 56, 489, 48, 477]),
  region("feet-back-left", "ankles-feet", "Fuß links", "back", "left", [110, 457, 121, 447, 136, 448, 140, 477, 132, 489, 118, 493, 104, 487, 100, 474]),
];

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
