export const MUSCLE_MAP_REFERENCE_SIZE = { width: 376, height: 504 } as const;

export type MuscleMapView = "front" | "back";
export type MuscleMapSide = "left" | "right" | "center";

export interface MuscleMapPart {
  readonly id: string;
  readonly optionId: string;
  readonly labelDe: string;
  readonly view: MuscleMapView;
  readonly side: MuscleMapSide;
  /** Polygon points in the original raster coordinate system. */
  readonly coordinates: readonly number[];
}

export const MUSCLE_MAP_PARTS: readonly MuscleMapPart[] = [
  { id: "neck-front", optionId: "neck", labelDe: "Nacken", view: "front", side: "center", coordinates: [84, 54, 108, 54, 112, 69, 109, 81, 103, 92, 96, 100, 89, 92, 82, 81, 79, 69] },
  { id: "traps-front", optionId: "traps", labelDe: "Trapezmuskel", view: "front", side: "center", coordinates: [76, 83, 85, 76, 96, 70, 107, 76, 117, 84, 111, 96, 101, 102, 91, 102, 81, 95] },
  { id: "deltoid-front-left", optionId: "shoulders", labelDe: "Schulter links", view: "front", side: "left", coordinates: [118, 88, 133, 91, 145, 99, 153, 110, 157, 124, 153, 139, 145, 151, 136, 154, 131, 144, 133, 126, 129, 109] },
  { id: "deltoid-front-right", optionId: "shoulders", labelDe: "Schulter rechts", view: "front", side: "right", coordinates: [74, 88, 59, 91, 47, 99, 39, 110, 35, 124, 39, 139, 47, 151, 56, 154, 61, 144, 59, 126, 63, 109] },
  { id: "pectoralis-left", optionId: "chest", labelDe: "Brust links", view: "front", side: "left", coordinates: [97, 105, 112, 98, 128, 98, 140, 103, 146, 112, 144, 123, 137, 132, 124, 137, 110, 135, 97, 126] },
  { id: "pectoralis-right", optionId: "chest", labelDe: "Brust rechts", view: "front", side: "right", coordinates: [95, 105, 80, 98, 64, 98, 52, 103, 46, 112, 48, 123, 55, 132, 68, 137, 82, 135, 95, 126] },
  { id: "biceps-left", optionId: "biceps", labelDe: "Bizeps links", view: "front", side: "left", coordinates: [143, 145, 153, 149, 159, 161, 160, 177, 157, 194, 151, 207, 143, 202, 139, 187, 139, 167] },
  { id: "biceps-right", optionId: "biceps", labelDe: "Bizeps rechts", view: "front", side: "right", coordinates: [49, 145, 39, 149, 33, 161, 32, 177, 35, 194, 41, 207, 49, 202, 53, 187, 53, 167] },
  { id: "forearm-front-left", optionId: "forearms-grip", labelDe: "Unterarm links", view: "front", side: "left", coordinates: [154, 202, 163, 211, 168, 229, 169, 249, 165, 268, 157, 282, 149, 280, 145, 264, 146, 240, 149, 218] },
  { id: "forearm-front-right", optionId: "forearms-grip", labelDe: "Unterarm rechts", view: "front", side: "right", coordinates: [38, 202, 29, 211, 24, 229, 23, 249, 27, 268, 35, 282, 43, 280, 47, 264, 46, 240, 43, 218] },
  { id: "abdominals", optionId: "abs", labelDe: "Bauchmuskulatur", view: "front", side: "center", coordinates: [79, 151, 113, 151, 118, 171, 117, 197, 115, 225, 111, 252, 103, 268, 96, 276, 89, 268, 81, 252, 77, 225, 75, 197, 74, 171] },
  { id: "obliques-left", optionId: "obliques", labelDe: "Seitlicher Core links", view: "front", side: "left", coordinates: [115, 155, 127, 162, 134, 177, 137, 198, 136, 221, 130, 242, 120, 257, 112, 246, 116, 219, 118, 192] },
  { id: "obliques-right", optionId: "obliques", labelDe: "Seitlicher Core rechts", view: "front", side: "right", coordinates: [77, 155, 65, 162, 58, 177, 55, 198, 56, 221, 62, 242, 72, 257, 80, 246, 76, 219, 74, 192] },
  { id: "hips-left", optionId: "hips", labelDe: "Hüfte links", view: "front", side: "left", coordinates: [103, 263, 119, 264, 130, 274, 132, 287, 125, 298, 110, 299, 101, 288, 99, 274] },
  { id: "hips-right", optionId: "hips", labelDe: "Hüfte rechts", view: "front", side: "right", coordinates: [89, 263, 73, 264, 62, 274, 60, 287, 67, 298, 82, 299, 91, 288, 93, 274] },
  { id: "quadriceps-left", optionId: "quadriceps", labelDe: "Quadrizeps links", view: "front", side: "left", coordinates: [102, 293, 118, 291, 128, 300, 133, 318, 134, 341, 130, 367, 124, 389, 115, 407, 106, 408, 101, 394, 101, 368, 102, 341, 100, 317] },
  { id: "quadriceps-right", optionId: "quadriceps", labelDe: "Quadrizeps rechts", view: "front", side: "right", coordinates: [90, 293, 74, 291, 64, 300, 59, 318, 58, 341, 62, 367, 68, 389, 77, 407, 86, 408, 91, 394, 91, 368, 90, 341, 92, 317] },
  { id: "adductors-left", optionId: "adductors", labelDe: "Adduktoren links", view: "front", side: "left", coordinates: [97, 294, 106, 296, 114, 309, 116, 329, 113, 351, 108, 373, 102, 389, 96, 375, 94, 350, 94, 324] },
  { id: "adductors-right", optionId: "adductors", labelDe: "Adduktoren rechts", view: "front", side: "right", coordinates: [95, 294, 86, 296, 78, 309, 76, 329, 79, 351, 84, 373, 90, 389, 96, 375, 98, 350, 98, 324] },
  { id: "tibialis-left", optionId: "tibialis", labelDe: "Tibialis links", view: "front", side: "left", coordinates: [111, 407, 123, 410, 129, 425, 130, 445, 126, 468, 119, 485, 112, 478, 108, 459, 108, 435] },
  { id: "tibialis-right", optionId: "tibialis", labelDe: "Tibialis rechts", view: "front", side: "right", coordinates: [81, 407, 69, 410, 63, 425, 62, 445, 66, 468, 73, 485, 80, 478, 84, 459, 84, 435] },
  { id: "feet-front-left", optionId: "ankles-feet", labelDe: "Fuß links", view: "front", side: "left", coordinates: [111, 468, 125, 468, 134, 479, 137, 490, 132, 499, 117, 502, 105, 498, 102, 490] },
  { id: "feet-front-right", optionId: "ankles-feet", labelDe: "Fuß rechts", view: "front", side: "right", coordinates: [81, 468, 67, 468, 58, 479, 55, 490, 60, 499, 75, 502, 87, 498, 90, 490] },

  { id: "neck-back", optionId: "neck", labelDe: "Nacken", view: "back", side: "center", coordinates: [273, 54, 297, 54, 301, 69, 297, 82, 292, 94, 285, 103, 278, 94, 273, 82, 269, 69] },
  { id: "trapezius", optionId: "traps", labelDe: "Trapezmuskel", view: "back", side: "center", coordinates: [264, 83, 273, 76, 285, 69, 297, 76, 307, 84, 315, 99, 310, 116, 301, 132, 292, 146, 285, 157, 278, 146, 269, 132, 260, 116, 255, 99] },
  { id: "rear-deltoid-left", optionId: "rear-delts", labelDe: "Hintere Schulter links", view: "back", side: "left", coordinates: [307, 91, 322, 94, 335, 102, 344, 114, 347, 128, 343, 142, 334, 153, 324, 154, 318, 145, 320, 127, 316, 109] },
  { id: "rear-deltoid-right", optionId: "rear-delts", labelDe: "Hintere Schulter rechts", view: "back", side: "right", coordinates: [263, 91, 248, 94, 235, 102, 226, 114, 223, 128, 227, 142, 236, 153, 246, 154, 252, 145, 250, 127, 254, 109] },
  { id: "rhomboids", optionId: "upper-back", labelDe: "Oberer Rücken", view: "back", side: "center", coordinates: [267, 116, 277, 108, 285, 112, 293, 108, 303, 116, 300, 137, 294, 156, 285, 171, 276, 156, 270, 137] },
  { id: "latissimus-left", optionId: "lats", labelDe: "Latissimus links", view: "back", side: "left", coordinates: [290, 150, 306, 145, 321, 152, 329, 166, 330, 185, 326, 205, 318, 224, 307, 239, 296, 245, 288, 230, 291, 206, 295, 181] },
  { id: "latissimus-right", optionId: "lats", labelDe: "Latissimus rechts", view: "back", side: "right", coordinates: [280, 150, 264, 145, 249, 152, 241, 166, 240, 185, 244, 205, 252, 224, 263, 239, 274, 245, 282, 230, 279, 206, 275, 181] },
  { id: "triceps-left", optionId: "triceps", labelDe: "Trizeps links", view: "back", side: "left", coordinates: [333, 151, 343, 156, 349, 169, 350, 186, 347, 204, 341, 219, 333, 216, 329, 202, 329, 181] },
  { id: "triceps-right", optionId: "triceps", labelDe: "Trizeps rechts", view: "back", side: "right", coordinates: [237, 151, 227, 156, 221, 169, 220, 186, 223, 204, 229, 219, 237, 216, 241, 202, 241, 181] },
  { id: "forearm-back-left", optionId: "forearms-grip", labelDe: "Unterarm links", view: "back", side: "left", coordinates: [346, 204, 355, 213, 360, 231, 361, 251, 357, 270, 349, 284, 341, 281, 337, 264, 338, 241, 341, 219] },
  { id: "forearm-back-right", optionId: "forearms-grip", labelDe: "Unterarm rechts", view: "back", side: "right", coordinates: [224, 204, 215, 213, 210, 231, 209, 251, 213, 270, 221, 284, 229, 281, 233, 264, 232, 241, 229, 219] },
  { id: "erector-spinae", optionId: "lower-back", labelDe: "Rückenstrecker", view: "back", side: "center", coordinates: [276, 205, 294, 205, 299, 225, 299, 247, 296, 266, 291, 279, 285, 286, 279, 279, 274, 266, 271, 247, 271, 225] },
  { id: "glute-left", optionId: "glutes", labelDe: "Gesäß links", view: "back", side: "left", coordinates: [287, 286, 300, 279, 314, 281, 325, 289, 330, 302, 328, 318, 319, 331, 305, 336, 291, 330, 284, 318] },
  { id: "glute-right", optionId: "glutes", labelDe: "Gesäß rechts", view: "back", side: "right", coordinates: [283, 286, 270, 279, 256, 281, 245, 289, 240, 302, 242, 318, 251, 331, 265, 336, 279, 330, 286, 318] },
  { id: "hamstrings-left", optionId: "hamstrings", labelDe: "Hamstrings links", view: "back", side: "left", coordinates: [292, 327, 307, 325, 318, 334, 324, 352, 325, 375, 321, 399, 313, 417, 303, 420, 296, 407, 294, 385, 295, 359] },
  { id: "hamstrings-right", optionId: "hamstrings", labelDe: "Hamstrings rechts", view: "back", side: "right", coordinates: [278, 327, 263, 325, 252, 334, 246, 352, 245, 375, 249, 399, 257, 417, 267, 420, 274, 407, 276, 385, 275, 359] },
  { id: "calf-left", optionId: "calves", labelDe: "Wade links", view: "back", side: "left", coordinates: [299, 414, 312, 414, 321, 425, 325, 443, 324, 461, 319, 478, 311, 489, 303, 483, 298, 468, 296, 448] },
  { id: "calf-right", optionId: "calves", labelDe: "Wade rechts", view: "back", side: "right", coordinates: [271, 414, 258, 414, 249, 425, 245, 443, 246, 461, 251, 478, 259, 489, 267, 483, 272, 468, 274, 448] },
  { id: "feet-back-left", optionId: "ankles-feet", labelDe: "Fuß links", view: "back", side: "left", coordinates: [302, 469, 317, 469, 326, 479, 330, 490, 325, 499, 310, 502, 297, 498, 294, 490] },
  { id: "feet-back-right", optionId: "ankles-feet", labelDe: "Fuß rechts", view: "back", side: "right", coordinates: [268, 469, 253, 469, 244, 479, 240, 490, 245, 499, 260, 502, 273, 498, 276, 490] },
] as const;

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
