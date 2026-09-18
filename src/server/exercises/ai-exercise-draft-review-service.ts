import "server-only";

import { combineClubTrainingRules, riskAllowedByClubRules } from "@/domain/training/club-rules";
import { normalizeExerciseText } from "@/domain/exercise/duplicate-detection";
import { listClubGroups } from "@/server/groups/group-repository";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import type { AiExerciseDraftProposal } from "./ai-exercise-draft-schema";

export type AiExerciseDraftReviewSeverity = "blocker" | "warning";

export interface AiExerciseDraftReviewIssue {
  readonly code:
    | "duplicate-name"
    | "category-phase"
    | "group-risk"
    | "group-age";
  readonly severity: AiExerciseDraftReviewSeverity;
  readonly message: string;
}

export interface AiExerciseDraftReview {
  readonly checkedAt: string;
  readonly issues: readonly AiExerciseDraftReviewIssue[];
  readonly blocking: boolean;
}

async function existingExerciseNames(): Promise<readonly { readonly id: string; readonly values: readonly string[] }[]> {
  await ensureDatabaseReady();
  return withDuckDbConnection(async (connection) => {
    const reader = await connection.runAndReadAll(`
      SELECT
        e.id::VARCHAR,
        COALESCE(string_agg(DISTINCT t.name, ' | '),''),
        COALESCE((SELECT string_agg(DISTINCT a.alias, ' | ') FROM exercise_aliases a WHERE a.exercise_id=e.id),'')
      FROM exercises e
      LEFT JOIN exercise_translations t ON t.exercise_id=e.id
      WHERE e.archived=false
      GROUP BY e.id
    `);
    return reader.getRows().map((row) => ({
      id: String(row[0]),
      values: [
        ...String(row[1] ?? "").split(" | "),
        ...String(row[2] ?? "").split(" | "),
      ].map((value) => value.trim()).filter(Boolean),
    }));
  });
}

function addCategoryPhaseWarnings(
  proposal: AiExerciseDraftProposal,
  issues: AiExerciseDraftReviewIssue[],
): void {
  if (proposal.category === "warmup" && proposal.phase !== "warmup") {
    issues.push({
      code: "category-phase",
      severity: "warning",
      message: "Kategorie Aufwärmen ist nicht der Warm-up-Phase zugeordnet. Trainerprüfung erforderlich.",
    });
  }
  if (proposal.category === "cooldown" && proposal.phase !== "cooldown") {
    issues.push({
      code: "category-phase",
      severity: "warning",
      message: "Kategorie Cooldown ist nicht der Cooldown-Phase zugeordnet. Trainerprüfung erforderlich.",
    });
  }
}

export async function reviewAiExerciseDraftProposal(
  proposal: AiExerciseDraftProposal,
): Promise<AiExerciseDraftReview> {
  const issues: AiExerciseDraftReviewIssue[] = [];
  const proposedValues = [
    proposal.nameDe,
    proposal.nameEn,
    ...proposal.aliasesDe,
    ...proposal.aliasesEn,
  ].map(normalizeExerciseText).filter(Boolean);
  const proposedSet = new Set(proposedValues);

  for (const existing of await existingExerciseNames()) {
    const collision = existing.values
      .map(normalizeExerciseText)
      .find((value) => value && proposedSet.has(value));
    if (!collision) continue;
    issues.push({
      code: "duplicate-name",
      severity: "blocker",
      message: `Eine aktive Übung verwendet bereits denselben normalisierten Namen/Alias (ID ${existing.id}).`,
    });
    break;
  }

  addCategoryPhaseWarnings(proposal, issues);

  const groups = await listClubGroups(false);
  const riskBlockedGroups: string[] = [];
  const ageBlockedGroups: string[] = [];

  for (const group of groups) {
    const rules = combineClubTrainingRules(group.ruleProfile, group.maximumRiskLevel);
    if (!riskAllowedByClubRules(proposal.riskLevel, rules)) {
      riskBlockedGroups.push(group.name);
    }
    if (
      proposal.minAge != null
      && group.minAge != null
      && group.minAge < proposal.minAge
    ) {
      ageBlockedGroups.push(group.name);
    }
  }

  if (riskBlockedGroups.length) {
    issues.push({
      code: "group-risk",
      severity: "warning",
      message: `Die Risikostufe ist für folgende aktive Gruppen nach deren Clubregeln nicht zulässig: ${riskBlockedGroups.join(", ")}.`,
    });
  }

  if (ageBlockedGroups.length) {
    issues.push({
      code: "group-age",
      severity: "warning",
      message: `Das Mindestalter schließt Teilnehmende folgender aktiver Gruppen aus: ${ageBlockedGroups.join(", ")}.`,
    });
  }

  return {
    checkedAt: new Date().toISOString(),
    issues,
    blocking: issues.some((issue) => issue.severity === "blocker"),
  };
}
