import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  MUSCLE_MAP_IMAGE_BASE64,
  MUSCLE_MAP_IMAGE_BYTE_LENGTH,
  MUSCLE_MAP_IMAGE_SHA256,
} from "@/data/muscle-map-image";

describe("muscle map raster asset", () => {
  it("assembles the reviewed non-empty WebP exactly", () => {
    const file = Buffer.from(MUSCLE_MAP_IMAGE_BASE64, "base64");
    const digest = createHash("sha256").update(file).digest("hex");

    expect(file.byteLength).toBe(MUSCLE_MAP_IMAGE_BYTE_LENGTH);
    expect(file.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(file.subarray(8, 12).toString("ascii")).toBe("WEBP");
    expect(digest).toBe(MUSCLE_MAP_IMAGE_SHA256);
  });
});
