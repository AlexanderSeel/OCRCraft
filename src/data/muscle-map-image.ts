import { MUSCLE_MAP_IMAGE_PART_1 } from "./muscle-map-image-part-1";
import { MUSCLE_MAP_IMAGE_PART_2 } from "./muscle-map-image-part-2";
import { MUSCLE_MAP_IMAGE_PART_3 } from "./muscle-map-image-part-3";
import { MUSCLE_MAP_IMAGE_PART_4 } from "./muscle-map-image-part-4";

/**
 * Checked-in raster source for the interactive muscle map.
 * Kept as base64 text because the GitHub connector cannot reliably write binary assets.
 * The route handler serves these bytes as image/webp at the stable asset URL used by the UI.
 */
export const MUSCLE_MAP_IMAGE_BASE64 =
  MUSCLE_MAP_IMAGE_PART_1 +
  MUSCLE_MAP_IMAGE_PART_2 +
  MUSCLE_MAP_IMAGE_PART_3 +
  MUSCLE_MAP_IMAGE_PART_4;

export const MUSCLE_MAP_IMAGE_BYTE_LENGTH = 19_416;
export const MUSCLE_MAP_IMAGE_SHA256 = "00aac7dade4ee18735f8c9018291352eec1d8a574db973dcbdab619d8bb0501d";
