import "server-only";

import type { TrainingOrganizationMode } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UpdateTrainingOrganizationInput {
  readonly organizationMode: TrainingOrganizationMode;
  readonly teamSize: number | null;
}

export async function updateTrainingOrganization(
  sessionId: string,
  input: UpdateTrainingOrganizationInput,
): Promise<boolean> {
  if (!UUID_PATTERN.test(sessionId)) return false;
  if (input.organizationMode === "team" && (input.teamSize == null || input.teamSize < 2 || input.teamSize > 20)) {
    throw new Error("Für Teamtraining ist eine Teamgröße zwischen 2 und 20 erforderlich.");
  }

  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      UPDATE training_sessions
      SET organization_mode=$organizationMode,
          team_size=CASE WHEN $organizationMode='team' THEN $teamSize ELSE NULL END,
          status='draft',
          updated_at=current_timestamp
      WHERE id=$sessionId::UUID
      RETURNING id::VARCHAR
      `,
      {
        sessionId,
        organizationMode: input.organizationMode,
        teamSize: input.organizationMode === "team" ? input.teamSize : null,
      },
    );
    return reader.getRows().length > 0;
  });
}
