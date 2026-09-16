import { MUSCLE_MAP_IMAGE_BASE64 } from "@/data/muscle-map-image";

export const dynamic = "force-static";

export function GET() {
  const bytes = Buffer.from(MUSCLE_MAP_IMAGE_BASE64, "base64");

  return new Response(bytes, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(bytes.byteLength),
      // Keep this short enough that a corrected raster is not hidden by a year-long browser cache.
      "Cache-Control": "public, max-age=300, must-revalidate",
    },
  });
}
