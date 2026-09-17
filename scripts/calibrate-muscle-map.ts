/** Rebuild derived WebP hit polygons from the pinned Apache-2.0 SVG source.
 * Each anatomical region has its own target contour: the two drawings differ
 * in pose, so a single affine transform cannot register them.
 */
import { readFile, writeFile } from "node:fs/promises";
import { svgPathProperties } from "svg-path-properties";

interface Source { id: string; path: string }
interface Calibration {
  id: string; sourceId: string; parentId: string; labelDe: string; labelEn: string;
  view: "front" | "back"; side: "left" | "right" | "center";
  kind: "muscle" | "body-area"; targetContour: number[];
}
interface Point { x: number; y: number }
function contours(path: string): Point[][] {
  const result: Point[][] = [];
  let current: Point[] = [];
  for (const segment of new svgPathProperties(path).getParts()) {
    const last = current.at(-1);
    if (last && Math.hypot(last.x - segment.start.x, last.y - segment.start.y) > 0.001) {
      if (current.length >= 3) result.push(current);
      current = [];
    }
    const steps = Math.max(1, Math.ceil(segment.length / 0.15));
    for (let i = 0; i <= steps; i++) current.push(segment.getPointAtLength(segment.length * i / steps));
    if (segment.details[0] === "Z") {
      if (current.length >= 3) result.push(current);
      current = [];
    }
  }
  if (current.length >= 3) result.push(current);
  return result;
}

function bounds(points: Point[]) {
  return { minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)), maxY: Math.max(...points.map(p => p.y)) };
}
function span(polygons: Point[][], y: number): [number, number] {
  const xs: number[] = [];
  for (const polygon of polygons) for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) xs.push(a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y));
  }
  if (xs.length < 2) {
    const box = bounds(polygons.flat());
    return [box.minX, box.maxX];
  }
  return [Math.min(...xs), Math.max(...xs)];
}

async function main() {
  const sources: Source[] = JSON.parse(await readFile("vendor/body-muscles/paths.json", "utf8"));
  const calibration: Calibration[] = JSON.parse(await readFile("vendor/body-muscles/calibration.json", "utf8"));
  const parts = calibration.flatMap(entry => {
    const source = sources.find(s => s.id === entry.sourceId);
    if (!source) throw new Error(`Missing SVG source: ${entry.sourceId}`);
    const original = contours(source.path);
    const sourceBox = bounds(original.flat());
    const target = entry.targetContour.reduce<Point[]>((points, x, i, all) => {
      if (i % 2 === 0) points.push({ x, y: all[i + 1] });
      return points;
    }, []);
    const targetBox = bounds(target);
    return original.map((polygon, index) => {
      const coordinates = polygon.flatMap(p => {
        const t = Math.max(0.0001, Math.min(0.9999, (p.y - sourceBox.minY) / (sourceBox.maxY - sourceBox.minY)));
        const y = targetBox.minY + t * (targetBox.maxY - targetBox.minY);
        const [sl, sr] = span(original, sourceBox.minY + t * (sourceBox.maxY - sourceBox.minY));
        const [tl, tr] = span([target], y);
        const u = Math.max(0, Math.min(1, (p.x - sl) / Math.max(0.0001, sr - sl)));
        return [Number((tl + u * (tr - tl)).toFixed(3)), Number(y.toFixed(3))];
      });
      return { id: `${entry.id}:${index}`, optionId: entry.id, labelDe: entry.labelDe,
        view: entry.view, side: entry.side, coordinates };
    });
  });
  // The SVG uses disconnected decorative strips. Preserve their transformation
  // for review, but close those illustration gaps for the WebP interaction surface.
  // Highlight and pointer testing both use this same calibrated outer contour.
  await writeFile("vendor/body-muscles/transformed-svg-contours.json", JSON.stringify(parts) + "\n");
  const surfaces = calibration.map(entry => ({ id: entry.id, optionId: entry.id,
    labelDe: entry.labelDe, view: entry.view, side: entry.side, coordinates: entry.targetContour }));
  const metadata = calibration.map(entry => ({ id: entry.id, sourceId: entry.sourceId,
    parentId: entry.parentId, labelDe: entry.labelDe, labelEn: entry.labelEn,
    view: entry.view, side: entry.side, kind: entry.kind }));
  await writeFile("src/data/muscle-map-detail-parts.json", JSON.stringify(surfaces) + "\n");
  await writeFile("src/domain/muscle-details.json", JSON.stringify(metadata, null, 2) + "\n");
  const quote = (text: string) => `'${text.replaceAll("'", "''")}'`;
  await writeFile("src/server/db/migrations/022_detailed_body_regions.sql", [
    "-- Derived catalog from vulovix/body-muscles; see vendor/body-muscles/NOTICE.",
    "BEGIN TRANSACTION;",
    "INSERT OR IGNORE INTO body_regions (id,label_de,label_en) VALUES",
    metadata.map(m => `(${quote(m.id)},${quote(m.labelDe)},${quote(m.labelEn)})`).join(",\n") + ";",
    "INSERT OR IGNORE INTO schema_migrations (version,name) VALUES (22,'detailed_body_regions');",
    "COMMIT;", "",
  ].join("\n"));
  console.log(`Registered ${metadata.length} detail regions with ${parts.length} transformed contours.`);

}
void main();
