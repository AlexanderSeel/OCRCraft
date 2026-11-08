import { randomUUID } from "node:crypto";
import { link, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/** Publish complete bytes without replacing an existing review candidate. */
export async function writeImmutableImageFile(destination, bytes) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporaryPath = `${destination}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, bytes, { flag: "wx" });
    // A hard link publishes the complete file atomically and fails if the
    // destination exists, including when two writers race for the same key.
    await link(temporaryPath, destination);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}
