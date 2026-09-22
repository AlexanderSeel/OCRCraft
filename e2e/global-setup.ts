import { createHmac } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DuckDBInstance } from "@duckdb/node-api";

const storageStatePath = path.join(process.cwd(), "e2e", ".auth", "storage-state.json");
const e2eDatabasePath = process.env.OCRCRAFT_E2E_DB_PATH ?? path.join(process.cwd(), "e2e", ".auth", "ocrcraft-e2e.duckdb");
const exportPath = path.join(process.cwd(), "e2e", ".auth", "database-export");

function sqlPath(value: string): string {
  return value.replaceAll("'", "''");
}

export default async function globalSetup(): Promise<void> {
  const sourceDatabasePath = process.env.OCRCRAFT_E2E_SOURCE_DB_PATH
    ?? process.env.OCRCRAFT_DB_PATH
    ?? path.join(process.cwd(), "data", "ocrcraft.duckdb");
  await rm(exportPath, { recursive: true, force: true });
  await rm(e2eDatabasePath, { force: true });

  const sourceInstance = await DuckDBInstance.create(sourceDatabasePath, { access_mode: "READ_ONLY" });
  const sourceConnection = await sourceInstance.connect();
  try {
    await sourceConnection.run(`EXPORT DATABASE '${sqlPath(exportPath)}' (FORMAT PARQUET)`);
  } finally {
    sourceConnection.closeSync();
    sourceInstance.closeSync();
  }

  const instance = await DuckDBInstance.create(e2eDatabasePath);
  const connection = await instance.connect();
  try {
    await connection.run(`IMPORT DATABASE '${sqlPath(exportPath)}'`);
    const userResult = await connection.runAndReadAll("SELECT email FROM app_users WHERE active=true ORDER BY created_at LIMIT 1");
    const email = String(userResult.getRows()[0]?.[0] ?? "").trim().toLowerCase();
    const codeResult = await connection.runAndReadAll("SELECT club_access_code FROM app_auth_settings WHERE id=1");
    const secret = String(codeResult.getRows()[0]?.[0] ?? process.env.OCRCRAFT_LOGIN_CODE ?? "").trim();
    if (!email || !secret) throw new Error("E2E-Sitzung kann ohne aktiven Testbenutzer und Vereinscode nicht erstellt werden.");

    const issuedAt = Math.floor(Date.now() / 1000);
    const payload = `${email}|${issuedAt}`;
    const signature = createHmac("sha256", secret).update(payload).digest("hex");
    await mkdir(path.dirname(storageStatePath), { recursive: true });
    await writeFile(storageStatePath, JSON.stringify({
      cookies: [{
        name: "ocrcraft-actor",
        value: `${payload}|${signature}`,
        domain: "127.0.0.1",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        expires: issuedAt + 300,
      }],
      origins: [],
    }), "utf8");
  } finally {
    connection.closeSync();
    instance.closeSync();
  }
}
