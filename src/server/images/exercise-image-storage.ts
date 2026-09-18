import "server-only";

import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StoredExerciseImage } from "./exercise-image-types";

export interface SaveExerciseImageInput {
  readonly exerciseId: string;
  readonly assetId: string;
  readonly fileStem?: string;
  readonly bytes: Uint8Array;
  readonly contentType: "image/png";
}

export interface ExerciseImageStorage {
  readonly provider: StoredExerciseImage["storageProvider"];
  save(input: SaveExerciseImageInput): Promise<StoredExerciseImage>;
  delete(storageKey: string): Promise<void>;
  listKeys?(): Promise<readonly string[]>;
  close?(): void;
}

function safeObjectKey(exerciseId: string, assetId: string, fileStem?: string): string {
  const stem = fileStem && /^[a-z0-9][a-z0-9-]*$/i.test(fileStem) ? fileStem : assetId;
  return `${fileStem && /^[a-z0-9][a-z0-9-]*$/i.test(fileStem) ? stem : exerciseId}/${stem}.png`;
}

export class FileSystemExerciseImageStorage implements ExerciseImageStorage {
  readonly provider = "filesystem" as const;
  private readonly root: string;

  constructor(root = path.join(process.cwd(), "public", "generated", "exercises")) {
    this.root = path.resolve(root);
  }

  async save(input: SaveExerciseImageInput): Promise<StoredExerciseImage> {
    const storageKey = safeObjectKey(input.exerciseId, input.assetId, input.fileStem);
    const destination = path.resolve(this.root, storageKey);
    if (!destination.startsWith(`${this.root}${path.sep}`)) throw new Error("Invalid exercise image storage key.");
    await mkdir(path.dirname(destination), { recursive: true });
    const temporaryPath = `${destination}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporaryPath, input.bytes, { flag: "wx" });
      await rename(temporaryPath, destination);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
    return {
      storageProvider: this.provider,
      storageKey,
      storageUri: `/generated/exercises/${storageKey.replaceAll("\\", "/")}`,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const destination = path.resolve(this.root, storageKey);
    if (!destination.startsWith(`${this.root}${path.sep}`)) throw new Error("Invalid exercise image storage key.");
    await rm(destination, { force: true });
  }

  async listKeys(): Promise<readonly string[]> {
    const keys: string[] = [];
    const walk = async (directory: string): Promise<void> => {
      const entries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
      for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await walk(absolute);
        } else if (entry.isFile()) {
          keys.push(path.relative(this.root, absolute).split(path.sep).join("/"));
        }
      }
    };
    await walk(this.root);
    return keys.sort();
  }
}

export interface S3CompatibleExerciseImageStorageOptions {
  readonly client: S3Client;
  readonly bucket: string;
  readonly prefix?: string;
  readonly publicBaseUrl?: string;
}

export class S3CompatibleExerciseImageStorage implements ExerciseImageStorage {
  readonly provider = "s3" as const;
  private readonly prefix: string;

  constructor(private readonly options: S3CompatibleExerciseImageStorageOptions) {
    this.prefix = (options.prefix ?? "exercise-images").replace(/^\/+|\/+$/g, "");
  }

  async save(input: SaveExerciseImageInput): Promise<StoredExerciseImage> {
    const storageKey = `${this.prefix}/${safeObjectKey(input.exerciseId, input.assetId, input.fileStem)}`;
    await this.options.client.send(new PutObjectCommand({
      Bucket: this.options.bucket,
      Key: storageKey,
      Body: input.bytes,
      ContentType: input.contentType,
    }));
    const baseUrl = this.options.publicBaseUrl?.replace(/\/+$/, "");
    return {
      storageProvider: this.provider,
      storageKey,
      storageUri: baseUrl
        ? `${baseUrl}/${storageKey.split("/").map(encodeURIComponent).join("/")}`
        : `s3://${this.options.bucket}/${storageKey}`,
    };
  }

  async delete(storageKey: string): Promise<void> {
    await this.options.client.send(new DeleteObjectCommand({ Bucket: this.options.bucket, Key: storageKey }));
  }

  async listKeys(): Promise<readonly string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;
    do {
      const result = await this.options.client.send(new ListObjectsV2Command({
        Bucket: this.options.bucket,
        Prefix: this.prefix ? this.prefix + "/" : undefined,
        ContinuationToken: continuationToken,
      }));
      for (const item of result.Contents ?? []) {
        if (item.Key) keys.push(item.Key);
      }
      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (continuationToken);
    return keys.sort();
  }

  close(): void {
    this.options.client.destroy();
  }
}

export function createExerciseImageStorageFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): ExerciseImageStorage {
  const driver = environment.OCRCRAFT_IMAGE_STORAGE ?? "filesystem";
  if (driver === "filesystem") return new FileSystemExerciseImageStorage();
  if (driver !== "s3") throw new Error("OCRCRAFT_IMAGE_STORAGE must be either filesystem or s3.");

  const bucket = environment.OCRCRAFT_IMAGE_BUCKET;
  if (!bucket) throw new Error("OCRCRAFT_IMAGE_BUCKET is required when OCRCRAFT_IMAGE_STORAGE=s3.");
  const endpoint = environment.OCRCRAFT_S3_ENDPOINT;
  const region = environment.OCRCRAFT_S3_REGION ?? environment.AWS_REGION ?? "us-east-1";
  const accessKeyId = environment.AWS_ACCESS_KEY_ID;
  const secretAccessKey = environment.AWS_SECRET_ACCESS_KEY;
  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    throw new Error("Set both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or configure the AWS default credential chain.");
  }

  const client = new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  });
  return new S3CompatibleExerciseImageStorage({
    client,
    bucket,
    prefix: environment.OCRCRAFT_IMAGE_PREFIX,
    publicBaseUrl: environment.OCRCRAFT_IMAGE_PUBLIC_BASE_URL,
  });
}
