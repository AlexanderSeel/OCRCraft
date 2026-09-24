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

    const email = "e2e@ocrcraft.local";
    const e2eUserResult = await connection.runAndReadAll(
      "SELECT id::VARCHAR FROM app_users WHERE lower(email)=lower($email) LIMIT 1",
      { email },
    );
    if (e2eUserResult.getRows().length === 0) {
      await connection.run(
        `INSERT INTO app_users (email,display_name,role,active)
         VALUES ($email,'OCRCraft E2E','super_admin',true)`,
        { email },
      );
    } else {
      await connection.run(
        `UPDATE app_users
         SET display_name='OCRCraft E2E',role='super_admin',active=true,updated_at=current_timestamp
         WHERE lower(email)=lower($email)`,
        { email },
      );
    }

    const codeResult = await connection.runAndReadAll("SELECT club_access_code FROM app_auth_settings WHERE id=1");
    let secret = String(codeResult.getRows()[0]?.[0] ?? process.env.OCRCRAFT_LOGIN_CODE ?? "").trim();
    if (!secret) {
      secret = "ocrcraft-e2e-access";
      await connection.run(
        `INSERT OR REPLACE INTO app_auth_settings (id,club_access_code,updated_at)
         VALUES (1,$secret,current_timestamp)`,
        { secret },
      );
    }

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
