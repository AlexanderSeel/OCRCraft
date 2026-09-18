import "server-only";

import type { TrainingOrganizationMode } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UpdateTrainingOrganizationInput {
  readonly organizationMode: TrainingOrganizationMode;
  readonly teamSize: number | null;
  /** Undefined means preserve an existing solo rotation split. Null clears it. */
  readonly groupSplitCount?: number | null;
}

export async function updateTrainingOrganization(
  sessionId: string,
  input: UpdateTrainingOrganizationInput,
): Promise<boolean> {
  if (!UUID_PATTERN.test(sessionId)) return false;
  if (input.organizationMode === "team" && (input.teamSize == null || input.teamSize < 2 || input.teamSize > 20)) {
    throw new Error("Für Teamtraining ist eine Teamgröße zwischen 2 und 20 erforderlich.");
  }
  if (input.organizationMode === "solo" && input.groupSplitCount != null && (input.groupSplitCount < 1 || input.groupSplitCount > 20)) {
    throw new Error("Die Zahl der Rotationsgruppen muss zwischen 1 und 20 liegen.");
  }

  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const groupSplitProvided = input.groupSplitCount !== undefined;
    const reader = await connection.runAndReadAll(
      `
      UPDATE training_sessions
      SET organization_mode=$organizationMode,
          team_size=CASE WHEN $organizationMode='team' THEN $teamSize ELSE NULL END,
          group_split_count=CASE
            WHEN $organizationMode='team' THEN NULL
            WHEN $groupSplitProvided THEN $groupSplitCount
            ELSE group_split_count
          END,
          status='draft',
          updated_at=current_timestamp
      WHERE id=$sessionId::UUID
      RETURNING id::VARCHAR
      `,
      {
        sessionId,
        organizationMode: input.organizationMode,
        teamSize: input.organizationMode === "team" ? input.teamSize : null,
        groupSplitProvided,
        groupSplitCount: input.organizationMode === "solo" && groupSplitProvided ? input.groupSplitCount ?? null : null,
      },
    );
    return reader.getRows().length > 0;
  });
}