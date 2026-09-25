import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { FileSystemExerciseImageStorage, resolveS3ImageStorageConfig, S3CompatibleExerciseImageStorage } from "./exercise-image-storage";

const exerciseId = "35b80ab9-27a4-444d-96e4-0e3297957426";
const assetId = "6f42f47b-3442-49eb-a6f3-5bc4fb374d18";

describe("exercise image storage", () => {
  it("keeps file-stem based assets unique per generation record", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ocrcraft-image-test-"));
    const storage = new FileSystemExerciseImageStorage(root);
    try {
      const stored = await storage.save({ exerciseId, assetId, fileStem: "easy-jog", bytes: new Uint8Array([1]), contentType: "image/png" });
      expect(stored.storageKey).toBe(`easy-jog/easy-jog-${assetId}.png`);
      expect(stored.storageUri).toBe(`/generated/exercises/easy-jog/easy-jog-${assetId}.png`);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

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
      cacheControl: "public, max-age=3600",
      serverSideEncryption: "AES256",
    });
    const stored = await storage.save({ exerciseId, assetId, bytes: new Uint8Array([7]), contentType: "image/png" });
    await storage.healthCheck();
    await storage.delete(stored.storageKey);

    expect(stored.storageUri).toBe(`https://cdn.example.test/assets/exercise-images/${exerciseId}/${assetId}.png`);
    expect(commands[0]).toBeInstanceOf(PutObjectCommand);
    expect((commands[0] as PutObjectCommand).input).toMatchObject({
      CacheControl: "public, max-age=3600",
      ServerSideEncryption: "AES256",
      Metadata: {
        "ocrcraft-exercise-id": exerciseId,
        "ocrcraft-asset-id": assetId,
      },
    });
    expect(commands[1]).toBeInstanceOf(HeadBucketCommand);
    expect(commands[2]).toBeInstanceOf(DeleteObjectCommand);
    expect(send).toHaveBeenCalledTimes(3);
  });
  it("validates production S3 delivery, encryption, and endpoint settings", () => {
    expect(() => resolveS3ImageStorageConfig({
      NODE_ENV: "production",
      OCRCRAFT_IMAGE_BUCKET: "training-media",
    })).toThrow("OCRCRAFT_IMAGE_PUBLIC_BASE_URL");

    expect(() => resolveS3ImageStorageConfig({
      NODE_ENV: "production",
      OCRCRAFT_IMAGE_BUCKET: "training-media",
      OCRCRAFT_IMAGE_PUBLIC_BASE_URL: "https://cdn.example.test",
      OCRCRAFT_S3_ENDPOINT: "http://minio.internal:9000",
    })).toThrow("must use https in production");

    expect(resolveS3ImageStorageConfig({
      NODE_ENV: "production",
      OCRCRAFT_IMAGE_BUCKET: "training-media",
      OCRCRAFT_IMAGE_PUBLIC_BASE_URL: "https://cdn.example.test",
      OCRCRAFT_S3_ENDPOINT: "https://s3.example.test",
      OCRCRAFT_S3_SSE: "aws:kms",
      OCRCRAFT_S3_KMS_KEY_ID: "kms-key",
    })).toMatchObject({
      bucket: "training-media",
      publicBaseUrl: "https://cdn.example.test",
      endpoint: "https://s3.example.test",
      forcePathStyle: true,
      serverSideEncryption: "aws:kms",
      kmsKeyId: "kms-key",
    });
  });
});
