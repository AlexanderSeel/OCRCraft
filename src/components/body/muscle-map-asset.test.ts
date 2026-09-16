import { describe, expect, it } from "vitest";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const assetPath = join(process.cwd(), "public", "assets", "muscle-map-base.webp");

describe("muscle map raster asset", () => {
  it("is a non-empty WebP file", async () => {
    const file = await readFile(assetPath);
    const metadata = await stat(assetPath);

    expect(metadata.size).toBeGreaterThan(1024);
    expect(file.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(file.subarray(8, 12).toString("ascii")).toBe("WEBP");
  });
});
