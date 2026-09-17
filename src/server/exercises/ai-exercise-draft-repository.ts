import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { createExercise, setExerciseArchived } from "./exercise-repository";
import {
  aiExerciseDraftProposalSchema,
  type AiExerciseDraftProposal,
} from "./ai-exercise-draft-schema";

export type AiExerciseDraftStatus = "pending" | "approving" | "approved" | "rejected";

export interface AiExerciseDraftRecord {
  readonly id: string;
  readonly status: AiExerciseDraftStatus;
  readonly providerId: string;
  readonly providerModel: string | null;
  readonly requestText: string;
  readonly proposal: AiExerciseDraftProposal;
  readonly approvedExerciseId: string | null;
  readonly createdAt: string;
  readonly reviewedAt: string | null;
}

function rowToRecord(row: readonly unknown[]): AiExerciseDraftRecord {
  return {
    id: String(row[0]),
    status: String(row[1]) as AiExerciseDraftStatus,
    providerId: String(row[2]),
    providerModel: row[3] == null ? null : String(row[3]),
    requestText: String(row[4]),
    proposal: aiExerciseDraftProposalSchema.parse(JSON.parse(String(row[5]))),
    approvedExerciseId: row[6] == null ? null : String(row[6]),
    createdAt: String(row[7]),
    reviewedAt: row[8] == null ? null : String(row[8]),
  };
}

const SELECT_COLUMNS = `
  id::VARCHAR,status,provider_id,provider_model,request_text,proposal_json,
  approved_exercise_id::VARCHAR,created_at,reviewed_at
`;

export async function saveAiExerciseDraft(
  requestText: string,
  providerId: string,
  providerModel: string | null,
  proposal: AiExerciseDraftProposal,
): Promise<string> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      INSERT INTO ai_exercise_drafts (
        provider_id,provider_model,request_text,proposal_json,
        name_de,name_en,category,phase,risk_level,min_age
      ) VALUES (
        $providerId,$providerModel,$requestText,$proposalJson,
        $nameDe,$nameEn,$category,$phase,$riskLevel,$minAge
      )
      RETURNING id::VARCHAR
      `,
      {
        providerId,
        providerModel,
        requestText: requestText.trim(),
        proposalJson: JSON.stringify(proposal),
        nameDe: proposal.nameDe,
        nameEn: proposal.nameEn,
        category: proposal.category,
        phase: proposal.phase,
        riskLevel: proposal.riskLevel,
        minAge: proposal.minAge,
      },
    );
    return String(reader.getRows()[0]?.[0]);
  });
}

export async function listAiExerciseDrafts(
  status?: AiExerciseDraftStatus,
  limit = 100,
): Promise<readonly AiExerciseDraftRecord[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      SELECT ${SELECT_COLUMNS}
      FROM ai_exercise_drafts
      WHERE $status='' OR status=$status
      ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approving' THEN 1 WHEN 'approved' THEN 2 ELSE 3 END,
        created_at DESC
      LIMIT $limit
      `,
      { status: status ?? "", limit },
    );
    return reader.getRows().map(rowToRecord);
  });
}

export async function rejectAiExerciseDraft(id: string): Promise<boolean> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      UPDATE ai_exercise_drafts
      SET status='rejected', reviewed_at=current_timestamp
      WHERE id=$id::UUID AND status='pending'
      RETURNING id::VARCHAR
      `,
      { id },
    );
    return reader.getRows().length > 0;
  });
}

async function claimDraftForApproval(id: string): Promise<AiExerciseDraftRecord | null> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(
      `
      UPDATE ai_exercise_drafts
      SET status='approving'
      WHERE id=$id::UUID AND status='pending'
      RETURNING ${SELECT_COLUMNS}
      `,
      { id },
    );
    const row = reader.getRows()[0];
    return row ? rowToRecord(row) : null;
  });
}

async function resetApprovalClaim(id: string): Promise<void> {
  await withDuckDbConnection(async (connection) => {
    await connection.run(
      "UPDATE ai_exercise_drafts SET status='pending' WHERE id=$id::UUID AND status='approving'",
      { id },
    );
  });
}

export async function approveAiExerciseDraft(id: string): Promise<string | null> {
  const draft = await claimDraftForApproval(id);
  if (!draft) return null;

  let exerciseId: string | null = null;
  try {
    exerciseId = await createExercise({
      nameDe: draft.proposal.nameDe,
      nameEn: draft.proposal.nameEn,
      summaryDe: draft.proposal.summaryDe,
      summaryEn: draft.proposal.summaryEn,
      aliasesDe: [...new Set(draft.proposal.aliasesDe)],
      aliasesEn: [...new Set(draft.proposal.aliasesEn)],
      category: draft.proposal.category,
      phase: draft.proposal.phase,
      riskLevel: draft.proposal.riskLevel,
      minAge: draft.proposal.minAge,
    });

    await withDuckDbConnection(async (connection) => {
      await connection.run("BEGIN TRANSACTION");
      try {
        await connection.run(
          `
          INSERT INTO exercise_source_references (
            exercise_id,provider,title,source_url,source_type,notes
          ) VALUES (
            $exerciseId::UUID,$provider,$title,$sourceUrl,'ai_assisted',$notes
          )
          `,
          {
            exerciseId,
            provider: draft.providerModel
              ? `${draft.providerId}:${draft.providerModel}`
              : draft.providerId,
            title: `AI exercise draft: ${draft.proposal.nameEn}`,
            sourceUrl: `ocrcraft://ai-exercise-drafts/${draft.id}`,
            notes: `Trainer-approved AI draft. Original request: ${draft.requestText}`.slice(0, 4000),
          },
        );
        const finalized = await connection.runAndReadAll(
          `
          UPDATE ai_exercise_drafts
          SET status='approved', approved_exercise_id=$exerciseId::UUID, reviewed_at=current_timestamp
          WHERE id=$id::UUID AND status='approving'
          RETURNING id::VARCHAR
          `,
          { id: draft.id, exerciseId },
        );
        if (finalized.getRows().length === 0) throw new Error("AI draft approval claim was lost.");
        await connection.run("COMMIT");
      } catch (error) {
        await connection.run("ROLLBACK");
        throw error;
      }
    });
    return exerciseId;
  } catch (error) {
    if (exerciseId) {
      await setExerciseArchived(exerciseId, true).catch(() => undefined);
    }
    await resetApprovalClaim(draft.id).catch(() => undefined);
    throw error;
  }
}
