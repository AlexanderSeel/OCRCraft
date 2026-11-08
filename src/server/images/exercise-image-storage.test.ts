import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
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
      const replacement = await storage.save({ exerciseId, assetId: "next-candidate", fileStem: "easy-jog", bytes: new Uint8Array([2]), contentType: "image/png" });
      expect(replacement.storageKey).not.toBe(stored.storageKey);
      expect(await readFile(path.join(root, stored.storageKey))).toEqual(Buffer.from([1]));
      expect(await readFile(path.join(root, replacement.storageKey))).toEqual(Buffer.from([2]));
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

  it("preserves an existing candidate when the same asset key is saved again", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ocrcraft-image-collision-"));
    const storage = new FileSystemExerciseImageStorage(root);
    try {
      const original = await storage.save({ exerciseId, assetId, fileStem: "easy-jog", bytes: new Uint8Array([1, 2]), contentType: "image/png" });
      await expect(storage.save({ exerciseId, assetId, fileStem: "easy-jog", bytes: new Uint8Array([9]), contentType: "image/png" }))
        .rejects.toMatchObject({ code: "EEXIST" });
      expect(await readFile(path.join(root, original.storageKey))).toEqual(Buffer.from([1, 2]));
      expect(await readdir(path.join(root, "easy-jog"))).toEqual([path.basename(original.storageKey)]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("allows only one concurrent writer for an asset key and retains the winning bytes", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "ocrcraft-image-race-"));
    const storage = new FileSystemExerciseImageStorage(root);
    try {
      const inputs = [new Uint8Array([1, 2, 3]), new Uint8Array([8, 9])];
      const results = await Promise.allSettled(inputs.map((bytes) => storage.save({ exerciseId, assetId, bytes, contentType: "image/png" })));
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      const winner = results.findIndex((result) => result.status === "fulfilled");
      expect(results[1 - winner]).toMatchObject({ status: "rejected", reason: { code: "EEXIST" } });
      expect(await readFile(path.join(root, exerciseId, `${assetId}.png`))).toEqual(Buffer.from(inputs[winner]));
      expect(await readdir(path.join(root, exerciseId))).toEqual([`${assetId}.png`]);
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
      IfNoneMatch: "*",
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

  it("propagates an S3 collision without retrying an unconditional overwrite", async () => {
    const collision = Object.assign(new Error("Precondition failed"), { name: "PreconditionFailed", $metadata: { httpStatusCode: 412 } });
    const commands: PutObjectCommand[] = [];
    const send = vi.fn(async (command: PutObjectCommand) => { commands.push(command); throw collision; });
    const storage = new S3CompatibleExerciseImageStorage({
      client: { send } as unknown as S3Client,
      bucket: "training-media",
    });
    await expect(storage.save({ exerciseId, assetId, bytes: new Uint8Array([7]), contentType: "image/png" })).rejects.toBe(collision);
    expect(send).toHaveBeenCalledTimes(1);
    expect(commands[0].input.IfNoneMatch).toBe("*");
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
