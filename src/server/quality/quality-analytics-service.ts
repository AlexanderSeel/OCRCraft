import "server-only";

import type { Audience, TrainingLocation } from "@/domain/training/model";
import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";
import { getSeedCompletenessReport } from "@/server/exercises/seed-completeness-service";
import { listMediaGenerationCandidates, getMediaCatalogSummary } from "@/server/media/media-catalog-repository";
import { getMediaGenerationCandidateReason, type MediaGenerationCandidateReason } from "@/server/media/media-rights-core";
import { runRecentExerciseUseQuery } from "@/server/training/recent-training-use-core";
import { runTrainingDraftCandidateQuery } from "@/server/training/training-draft-candidate-core";

export interface QualityAnalyticsZeroScenario {
  readonly audience: Audience;
  readonly location: TrainingLocation;
  readonly minAge: number;
  readonly count: number;
  readonly explanation: string;
}

export interface QualityAnalyticsReport {
  readonly activeExercises: number;
  readonly usedExercises: number;
  readonly unusedExercises: number;
  readonly missingPrimaryBodyRegion: number;
  readonly ocrRelevantExercises: number;
  readonly obstacleGuidanceExercises: number;
  readonly obstacleCoveragePercent: number;
  readonly routeDistanceKilometres: number;
  readonly runningTrainingItems: number;
  readonly recentRepeatedExercises: readonly { readonly exerciseId: string; readonly name: string; readonly useCount: number }[];
  readonly zeroScenarios: readonly QualityAnalyticsZeroScenario[];
  readonly completeness: {
    readonly totalCatalogExercises: number;
    readonly incompleteCatalogExercises: number;
    readonly completePercent: number;
  };
  readonly mediaReplacement: {
    readonly totalCandidates: number;
    readonly reasons: Readonly<Record<MediaGenerationCandidateReason, number>>;
    readonly pendingMediaReviews: number;
    readonly approvedMedia: number;
  };
}

const scenarios: readonly { audience: Audience; location: TrainingLocation; minAge: number }[] = [
  { audience: "kids", location: "indoor", minAge: 10 },
  { audience: "kids", location: "outdoor", minAge: 10 },
  { audience: "youth", location: "indoor", minAge: 14 },
  { audience: "youth", location: "outdoor", minAge: 14 },
  { audience: "adults", location: "indoor", minAge: 18 },
  { audience: "adults", location: "outdoor", minAge: 18 },
];

export async function getQualityAnalyticsReport(): Promise<QualityAnalyticsReport> {
  await ensureDatabaseReady();
  const [completeness, mediaSummary, replacementCandidates, operational] = await Promise.all([
    getSeedCompletenessReport(),
    getMediaCatalogSummary(),
    listMediaGenerationCandidates("", 1000),
    withDuckDbConnection(async (connection) => {
      const catalogReader = await connection.runAndReadAll(`
        SELECT
          count(*),
          count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM training_items i WHERE i.exercise_id=e.id
          )),
          count(*) FILTER (WHERE NOT EXISTS (
            SELECT 1 FROM training_items i WHERE i.exercise_id=e.id
          )),
          count(*) FILTER (WHERE NOT EXISTS (
            SELECT 1 FROM exercise_body_regions b WHERE b.exercise_id=e.id AND b.emphasis='primary'
          )),
          count(*) FILTER (WHERE
            e.category='ocr-skill'
            OR EXISTS (SELECT 1 FROM exercise_tags t WHERE t.exercise_id=e.id AND t.tag_id='ocr')
            OR EXISTS (
              SELECT 1 FROM exercise_movement_patterns p
              WHERE p.exercise_id=e.id AND p.movement_pattern_id IN ('climb','hang','pull','carry','drag','balance','swing')
            )
          ),
          count(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM exercise_obstacle_guidance g WHERE g.exercise_id=e.id
          ))
        FROM exercises e
        WHERE e.archived=false
      `);
      const catalog = catalogReader.getRows()[0] ?? [];

      const routeReader = await connection.runAndReadAll(`
        SELECT
          COALESCE(sum(route_distance_metres),0),
          (
            SELECT count(*)
            FROM training_items i
            JOIN training_phases p ON p.id=i.training_phase_id
            JOIN training_sessions s2 ON s2.id=p.training_session_id
            JOIN exercises e2 ON e2.id=i.exercise_id
            WHERE s2.status<>'archived'
              AND (
                e2.category='running'
                OR EXISTS (
                  SELECT 1 FROM exercise_movement_patterns mp
                  WHERE mp.exercise_id=e2.id AND mp.movement_pattern_id IN ('run','walk')
                )
              )
          )
        FROM training_sessions
        WHERE status<>'archived'
      `);
      const route = routeReader.getRows()[0] ?? [];

      const recentUse = await runRecentExerciseUseQuery(connection, 6);
      const repeatedIds = recentUse.filter((item) => item.useCount >= 3);
      let repeated: { exerciseId: string; name: string; useCount: number }[] = [];
      if (repeatedIds.length > 0) {
        const namesReader = await connection.runAndReadAll(`
          SELECT e.id::VARCHAR,COALESCE(t.name,e.canonical_name)
          FROM exercises e
          LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
          WHERE list_contains(string_split($ids,','),e.id::VARCHAR)
        `, { ids: repeatedIds.map((item) => item.exerciseId).join(",") });
        const names = new Map(namesReader.getRows().map((row) => [String(row[0]), String(row[1])]));
        repeated = repeatedIds.map((item) => ({
          exerciseId: item.exerciseId,
          name: names.get(item.exerciseId) ?? item.exerciseId,
          useCount: item.useCount,
        }));
      }

      const zeroScenarios: QualityAnalyticsZeroScenario[] = [];
      for (const scenario of scenarios) {
        const candidates = await runTrainingDraftCandidateQuery(connection, {
          audience: scenario.audience,
          minAge: scenario.minAge,
          locale: "de",
          location: scenario.location,
        });
        zeroScenarios.push({
          ...scenario,
          count: candidates.length,
          explanation: candidates.length === 0
            ? "Keine aktive Übung erfüllt Zielgruppe, Mindestalter und Ort gleichzeitig."
            : `${candidates.length} aktive Übungen erfüllen Zielgruppe, Mindestalter und Ort.`,
        });
      }

      return {
        activeExercises: Number(catalog[0] ?? 0),
        usedExercises: Number(catalog[1] ?? 0),
        unusedExercises: Number(catalog[2] ?? 0),
        missingPrimaryBodyRegion: Number(catalog[3] ?? 0),
        ocrRelevantExercises: Number(catalog[4] ?? 0),
        obstacleGuidanceExercises: Number(catalog[5] ?? 0),
        routeDistanceMetres: Number(route[0] ?? 0),
        runningTrainingItems: Number(route[1] ?? 0),
        repeated,
        zeroScenarios,
      };
    }),
  ]);

  const ocrDenominator = Math.max(operational.ocrRelevantExercises, 1);
  const reasons: Record<MediaGenerationCandidateReason, number> = {
    job_running: 0,
    rights_blocked: 0,
    generation_failed: 0,
    unusable: 0,
    missing: 0,
  };
  for (const candidate of replacementCandidates) {
    reasons[getMediaGenerationCandidateReason(candidate)] += 1;
  }

  return {
    activeExercises: operational.activeExercises,
    usedExercises: operational.usedExercises,
    unusedExercises: operational.unusedExercises,
    missingPrimaryBodyRegion: operational.missingPrimaryBodyRegion,
    ocrRelevantExercises: operational.ocrRelevantExercises,
    obstacleGuidanceExercises: operational.obstacleGuidanceExercises,
    obstacleCoveragePercent: Math.round((operational.obstacleGuidanceExercises / ocrDenominator) * 100),
    routeDistanceKilometres: Math.round((operational.routeDistanceMetres / 1000) * 10) / 10,
    runningTrainingItems: operational.runningTrainingItems,
    recentRepeatedExercises: operational.repeated,
    zeroScenarios: operational.zeroScenarios,
    completeness: {
      totalCatalogExercises: completeness.totalCatalogExercises,
      incompleteCatalogExercises: completeness.incompleteCatalogExercises.length,
      completePercent: completeness.totalCatalogExercises === 0
        ? 100
        : Math.round((completeness.completeCatalogExercises / completeness.totalCatalogExercises) * 100),
    },
    mediaReplacement: {
      totalCandidates: replacementCandidates.length,
      reasons,
      pendingMediaReviews: mediaSummary.pendingReview,
      approvedMedia: mediaSummary.approved,
    },
  };
}
