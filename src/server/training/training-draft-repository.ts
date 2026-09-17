import "server-only";

import type { TrainingDraftExerciseCandidate } from "@/domain/training/draft";
import type { Audience, ExerciseEquipmentRequirement, TrainingLocation } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { runRecentExerciseUseQuery } from "./recent-training-use-core";
import {
  runTrainingEquipmentOptionsQuery,
  type TrainingEquipmentOption,
} from "./training-draft-catalog-core";
import { runTrainingDraftCandidateQuery } from "./training-draft-candidate-core";
export type { TrainingEquipmentOption } from "./training-draft-catalog-core";

interface ListTrainingDraftCandidatesOptions {
  readonly audience: Audience;
  readonly minAge?: number;
  readonly locale?: "de" | "en";
  readonly location?: TrainingLocation;
}

export type TrainingDraftCandidateWithHistory = TrainingDraftExerciseCandidate & {
  readonly recentUseCount: number;
};

export async function listTrainingEquipmentOptions(
  locale: "de" | "en" = "de",
): Promise<readonly TrainingEquipmentOption[]> {
  await ensureDatabaseReady();

  return withDuckDbConnection((connection) => runTrainingEquipmentOptionsQuery(connection, locale));
}

export async function listTrainingDraftCandidates({
  audience,
  minAge,
  locale = "de",
  location = "mixed",
}: ListTrainingDraftCandidatesOptions): Promise<readonly TrainingDraftCandidateWithHistory[]> {
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const baseCandidates = await runTrainingDraftCandidateQuery(connection, { audience, minAge, locale, location });
    const candidates = location === "outdoor" && baseCandidates.length > 0
      ? await applyOutdoorVariants(connection, baseCandidates, locale)
      : baseCandidates;
    const recentUse = await runRecentExerciseUseQuery(connection);
    const recentUseByExercise = new Map(recentUse.map((item) => [item.exerciseId, item.useCount]));
    return candidates.map((candidate) => ({
      ...candidate,
      recentUseCount: recentUseByExercise.get(candidate.id) ?? 0,
    }));
  });
}

async function applyOutdoorVariants(
  connection: Parameters<typeof runTrainingDraftCandidateQuery>[0],
  candidates: readonly TrainingDraftExerciseCandidate[],
  locale: "de" | "en",
): Promise<readonly TrainingDraftExerciseCandidate[]> {
  const ids = candidates.map((candidate) => candidate.id);
  if (ids.length === 0) return candidates;

  const equipmentReader = await connection.runAndReadAll(`
    SELECT v.exercise_id::VARCHAR,eq.id::VARCHAR,
      CASE WHEN $locale='de' THEN eq.name_de ELSE COALESCE(eq.name_en,eq.name_de) END,
      v.quantity_required
    FROM exercise_outdoor_variant_equipment v
    JOIN equipment eq ON eq.id=v.equipment_id
    WHERE list_contains(string_split($exerciseIds,','),v.exercise_id::VARCHAR)
    ORDER BY v.exercise_id::VARCHAR,eq.id::VARCHAR
  `, { locale, exerciseIds: ids.join(",") });
  const equipmentByExercise = new Map<string, ExerciseEquipmentRequirement[]>();
  for (const row of equipmentReader.getRows()) {
    const exerciseId = String(row[0]);
    const list = equipmentByExercise.get(exerciseId) ?? [];
    list.push({
      equipmentId: String(row[1]),
      name: String(row[2]),
      quantityPerStation: Number(row[3]),
    });
    equipmentByExercise.set(exerciseId, list);
  }

  const detailReader = await connection.runAndReadAll(`
    SELECT exercise_id::VARCHAR,COALESCE(outdoor_variant,'')
    FROM exercise_details
    WHERE locale=$locale
      AND list_contains(string_split($exerciseIds,','),exercise_id::VARCHAR)
      AND COALESCE(outdoor_variant,'')<>''
  `, { locale, exerciseIds: ids.join(",") });
  const textByExercise = new Map(detailReader.getRows().map((row) => [String(row[0]), String(row[1])]));

  return candidates.map((candidate) => {
    const variantEquipment = equipmentByExercise.get(candidate.id);
    const outdoorText = textByExercise.get(candidate.id);
    if (!variantEquipment || !outdoorText) return candidate;
    return {
      ...candidate,
      equipment: variantEquipment.map((item) => item.name),
      equipmentRequirements: variantEquipment,
      instructions: [candidate.instructions, outdoorText].filter(Boolean).join(" "),
      planningText: [candidate.planningText, outdoorText].filter(Boolean).join(" "),
    };
  });
}
