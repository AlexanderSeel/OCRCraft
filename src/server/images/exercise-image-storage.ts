import "server-only";

import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
  healthCheck?(): Promise<void>;
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
  readonly cacheControl?: string;
  readonly serverSideEncryption?: "AES256" | "aws:kms";
  readonly kmsKeyId?: string;
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
      CacheControl: this.options.cacheControl,
      ServerSideEncryption: this.options.serverSideEncryption,
      SSEKMSKeyId: this.options.serverSideEncryption === "aws:kms" ? this.options.kmsKeyId : undefined,
      Metadata: {
        "ocrcraft-exercise-id": input.exerciseId,
        "ocrcraft-asset-id": input.assetId,
      },
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

  async healthCheck(): Promise<void> {
    await this.options.client.send(new HeadBucketCommand({ Bucket: this.options.bucket }));
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

export interface ResolvedS3ImageStorageConfig {
  readonly bucket: string;
  readonly endpoint?: string;
  readonly region: string;
  readonly accessKeyId?: string;
  readonly secretAccessKey?: string;
  readonly prefix?: string;
  readonly publicBaseUrl?: string;
  readonly forcePathStyle: boolean;
  readonly cacheControl: string;
  readonly serverSideEncryption?: "AES256" | "aws:kms";
  readonly kmsKeyId?: string;
}

function parseHttpUrl(value: string, label: string, requireHttps: boolean): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(label + " must be a valid URL."); }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(label + " must use http or https.");
  }
  if (requireHttps && url.protocol !== "https:") {
    throw new Error(label + " must use https in production.");
  }
  return url.toString().replace(/\/$/, "");
}

export function resolveS3ImageStorageConfig(
  environment: NodeJS.ProcessEnv,
): ResolvedS3ImageStorageConfig {
  const bucket = environment.OCRCRAFT_IMAGE_BUCKET?.trim();
  if (!bucket) throw new Error("OCRCRAFT_IMAGE_BUCKET is required when OCRCRAFT_IMAGE_STORAGE=s3.");

  const production = environment.NODE_ENV === "production";
  const allowInsecure = environment.OCRCRAFT_S3_ALLOW_INSECURE_HTTP === "1";
  const endpointRaw = environment.OCRCRAFT_S3_ENDPOINT?.trim();
  const endpoint = endpointRaw
    ? parseHttpUrl(endpointRaw, "OCRCRAFT_S3_ENDPOINT", production && !allowInsecure)
    : undefined;

  const publicBaseRaw = environment.OCRCRAFT_IMAGE_PUBLIC_BASE_URL?.trim();
  if (production && !publicBaseRaw) {
    throw new Error("OCRCRAFT_IMAGE_PUBLIC_BASE_URL is required for S3 image delivery in production.");
  }
  const publicBaseUrl = publicBaseRaw
    ? parseHttpUrl(publicBaseRaw, "OCRCRAFT_IMAGE_PUBLIC_BASE_URL", production)
    : undefined;

  const accessKeyId = environment.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = environment.AWS_SECRET_ACCESS_KEY?.trim();
  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    throw new Error("Set both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or configure the AWS default credential chain.");
  }

  const encryption = environment.OCRCRAFT_S3_SSE?.trim() || "";
  if (encryption && encryption !== "AES256" && encryption !== "aws:kms") {
    throw new Error("OCRCRAFT_S3_SSE must be AES256, aws:kms, or empty.");
  }
  const kmsKeyId = environment.OCRCRAFT_S3_KMS_KEY_ID?.trim();
  if (encryption === "aws:kms" && !kmsKeyId) {
    throw new Error("OCRCRAFT_S3_KMS_KEY_ID is required when OCRCRAFT_S3_SSE=aws:kms.");
  }

  return {
    bucket,
    endpoint,
    region: environment.OCRCRAFT_S3_REGION?.trim() || environment.AWS_REGION?.trim() || "us-east-1",
    accessKeyId,
    secretAccessKey,
    prefix: environment.OCRCRAFT_IMAGE_PREFIX?.trim() || undefined,
    publicBaseUrl,
    forcePathStyle: environment.OCRCRAFT_S3_FORCE_PATH_STYLE === "1" || Boolean(endpoint),
    cacheControl: environment.OCRCRAFT_IMAGE_CACHE_CONTROL?.trim() || "public, max-age=31536000, immutable",
    serverSideEncryption: encryption ? encryption as "AES256" | "aws:kms" : undefined,
    kmsKeyId,
  };
}

export function createExerciseImageStorageFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): ExerciseImageStorage {
  const driver = environment.OCRCRAFT_IMAGE_STORAGE ?? "filesystem";
  if (driver === "filesystem") return new FileSystemExerciseImageStorage();
  if (driver !== "s3") throw new Error("OCRCRAFT_IMAGE_STORAGE must be either filesystem or s3.");

  const config = resolveS3ImageStorageConfig(environment);
  const client = new S3Client({
    region: config.region,
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    forcePathStyle: config.forcePathStyle,
    ...(config.accessKeyId && config.secretAccessKey
      ? { credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }
      : {}),
  });
  return new S3CompatibleExerciseImageStorage({
    client,
    bucket: config.bucket,
    prefix: config.prefix,
    publicBaseUrl: config.publicBaseUrl,
    cacheControl: config.cacheControl,
    serverSideEncryption: config.serverSideEncryption,
    kmsKeyId: config.kmsKeyId,
  });
}
