import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { FileSystemExerciseImageStorage, S3CompatibleExerciseImageStorage } from "./exercise-image-storage";

const exerciseId = "35b80ab9-27a4-444d-96e4-0e3297957426";
const assetId = "6f42f47b-3442-49eb-a6f3-5bc4fb374d18";

describe("exercise image storage", () => {
  it("writes an image atomically to the filesystem and deletes it by storage key", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ocrcraft-image-test-"));
    const storage = new FileSystemExerciseImageStorage(root);
    const bytes = new Uint8Array([1, 2, 3, 4]);
    try {
      const stored = await storage.save({ exerciseId, assetId, bytes, contentType: "image/png" });
      expect(stored).toMatchObject({
        storageProvider: "filesystem",
        storageKey: `${exerciseId}/${assetId}.png`,
        storageUri: `/generated/exercises/${exerciseId}/${assetId}.png`,
      });
      expect(await readFile(path.join(root, stored.storageKey))).toEqual(Buffer.from(bytes));

      await storage.delete(stored.storageKey);
      await expect(readFile(path.join(root, stored.storageKey))).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects traversal in filesystem deletion keys", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ocrcraft-image-test-"));
    try {
      const storage = new FileSystemExerciseImageStorage(root);
      await expect(storage.delete("../outside.png")).rejects.toThrow("Invalid exercise image storage key");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("uses the S3-compatible client for object save and delete operations", async () => {
    const commands: unknown[] = [];
    const send = vi.fn(async (command: unknown) => { commands.push(command); return {}; });
    const client = { send, destroy: vi.fn() } as unknown as S3Client;
    const storage = new S3CompatibleExerciseImageStorage({
      client,
      bucket: "training-media",
      prefix: "exercise-images",
      publicBaseUrl: "https://cdn.example.test/assets",
    });
    const stored = await storage.save({ exerciseId, assetId, bytes: new Uint8Array([7]), contentType: "image/png" });
    await storage.delete(stored.storageKey);

    expect(stored.storageUri).toBe(`https://cdn.example.test/assets/exercise-images/${exerciseId}/${assetId}.png`);
    expect(commands[0]).toBeInstanceOf(PutObjectCommand);
    expect(commands[1]).toBeInstanceOf(DeleteObjectCommand);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
