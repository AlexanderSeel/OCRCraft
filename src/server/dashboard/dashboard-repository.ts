import "server-only";

import { ensureDatabaseReady } from "@/server/db/database-ready";
import { withDuckDbConnection } from "@/server/db/duckdb";

export interface DashboardRecentTraining {
  readonly id: string;
  readonly title: string;
  readonly status: "draft" | "ready" | "completed" | "archived";
  readonly source: string;
  readonly durationMinutes: number;
  readonly itemCount: number;
  readonly createdAt: string;
}

export interface DashboardBucket {
  readonly key: string;
  readonly count: number;
}

export interface DashboardActivityBucket {
  readonly weekStart: string;
  readonly count: number;
  readonly minutes: number;
}

export interface DashboardExerciseUsage {
  readonly id: string;
  readonly name: string;
  readonly uses: number;
  readonly minutes: number;
}

export interface DashboardSnapshot {
  readonly training: {
    readonly total: number;
    readonly draft: number;
    readonly ready: number;
    readonly completed: number;
    readonly totalMinutes: number;
    readonly recent: readonly DashboardRecentTraining[];
    readonly activity: readonly DashboardActivityBucket[];
    readonly sources: readonly DashboardBucket[];
  };
  readonly exercises: {
    readonly active: number;
    readonly games: number;
    readonly categories: readonly DashboardBucket[];
  };
  readonly groups: {
    readonly active: number;
    readonly withoutTraining: number;
    readonly audiences: readonly DashboardBucket[];
  };
  readonly media: {
    readonly total: number;
    readonly generated: number;
    readonly pendingReview: number;
    readonly approved: number;
    readonly failed: number;
    readonly queue: {
      readonly queued: number;
      readonly running: number;
      readonly succeededRecent: number;
      readonly failedRecent: number;
    };
  };
  readonly ai: {
    readonly pendingDrafts: number;
    readonly approvingDrafts: number;
  };
  readonly analytics: {
    readonly distinctExercisesUsed: number;
    readonly runningMinutes: number;
    readonly runningItems: number;
    readonly bodyRegions: readonly DashboardBucket[];
    readonly topExercises: readonly DashboardExerciseUsage[];
  };
  readonly obstacles: {
    readonly active: number;
    readonly highRisk: number;
    readonly withClubDimensions: number;
  };
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  await ensureDatabaseReady();

  return withDuckDbConnection(async (connection) => {
    const summaryReader = await connection.runAndReadAll(`
      SELECT
        (SELECT count(*) FROM training_sessions WHERE status <> 'archived'),
        (SELECT count(*) FROM training_sessions WHERE status = 'draft'),
        (SELECT count(*) FROM training_sessions WHERE status = 'ready'),
        (SELECT count(*) FROM training_sessions WHERE status = 'completed'),
        (SELECT COALESCE(sum(total_duration_minutes), 0) FROM training_sessions WHERE status <> 'archived'),
        (SELECT count(*) FROM exercises WHERE archived = false),
        (SELECT count(*) FROM club_groups WHERE archived = false),
        (
          SELECT count(*)
          FROM club_groups g
          WHERE g.archived = false
            AND NOT EXISTS (
              SELECT 1
              FROM training_sessions s
              WHERE s.group_id = g.id AND s.status <> 'archived'
            )
        ),
        (SELECT count(*) FROM exercise_media_assets),
        (SELECT count(*) FROM exercise_media_assets WHERE generation_status = 'generated'),
        (SELECT count(*) FROM exercise_media_assets WHERE review_status = 'pending'),
        (SELECT count(*) FROM exercise_media_assets WHERE review_status = 'approved'),
        (SELECT count(*) FROM exercise_media_assets WHERE generation_status = 'failed'),
        (
          SELECT count(DISTINCT e.id)
          FROM exercises e
          WHERE e.archived = false
            AND EXISTS (SELECT 1 FROM exercise_obstacle_guidance g WHERE g.exercise_id = e.id)
        ),
        (
          SELECT count(DISTINCT e.id)
          FROM exercises e
          WHERE e.archived = false
            AND e.risk_level = 'high'
            AND EXISTS (SELECT 1 FROM exercise_obstacle_guidance g WHERE g.exercise_id = e.id)
        ),
        (
          SELECT count(DISTINCT e.id)
          FROM exercises e
          WHERE e.archived = false
            AND (
              e.club_obstacle_height_cm IS NOT NULL
              OR e.club_obstacle_span_cm IS NOT NULL
              OR e.club_obstacle_reach_cm IS NOT NULL
            )
            AND EXISTS (SELECT 1 FROM exercise_obstacle_guidance g WHERE g.exercise_id = e.id)
        ),
        (SELECT count(*) FROM exercises WHERE archived = false AND COALESCE(exercise_type, 'drill') = 'game'),
        (SELECT count(*) FROM ai_exercise_drafts WHERE status = 'pending'),
        (SELECT count(*) FROM ai_exercise_drafts WHERE status = 'approving'),
        (SELECT count(*) FROM exercise_image_generation_jobs WHERE status = 'queued'),
        (SELECT count(*) FROM exercise_image_generation_jobs WHERE status = 'running'),
        (
          SELECT count(*)
          FROM exercise_image_generation_jobs
          WHERE status = 'succeeded' AND created_at >= current_timestamp - INTERVAL '24 hours'
        ),
        (
          SELECT count(*)
          FROM exercise_image_generation_jobs
          WHERE status = 'failed' AND created_at >= current_timestamp - INTERVAL '24 hours'
        )
    `);

    const recentReader = await connection.runAndReadAll(`
      SELECT
        s.id::VARCHAR,
        s.title,
        s.status,
        s.source,
        s.total_duration_minutes,
        (
          SELECT count(*)
          FROM training_phases p
          JOIN training_items i ON i.training_phase_id = p.id
          WHERE p.training_session_id = s.id
        ),
        s.created_at
      FROM training_sessions s
      WHERE s.status <> 'archived'
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT 7
    `);

    const activityReader = await connection.runAndReadAll(`
      SELECT
        date_trunc('week', created_at)::VARCHAR,
        count(*),
        COALESCE(sum(total_duration_minutes), 0)
      FROM training_sessions
      WHERE status <> 'archived'
        AND created_at >= current_timestamp - INTERVAL '56 days'
      GROUP BY date_trunc('week', created_at)
      ORDER BY date_trunc('week', created_at)
    `);

    const sourceReader = await connection.runAndReadAll(`
      SELECT source, count(*)
      FROM training_sessions
      WHERE status <> 'archived'
      GROUP BY source
      ORDER BY count(*) DESC, source
    `);

    const categoryReader = await connection.runAndReadAll(`
      SELECT COALESCE(category, 'general'), count(*)
      FROM exercises
      WHERE archived = false
      GROUP BY COALESCE(category, 'general')
      ORDER BY count(*) DESC, COALESCE(category, 'general')
      LIMIT 7
    `);

    const audienceReader = await connection.runAndReadAll(`
      SELECT audience, count(*)
      FROM club_groups
      WHERE archived = false
      GROUP BY audience
      ORDER BY count(*) DESC, audience
    `);

    const analyticsReader = await connection.runAndReadAll(`
      SELECT
        count(DISTINCT i.exercise_id),
        COALESCE(sum(i.duration_minutes) FILTER (WHERE e.category = 'running'), 0),
        count(*) FILTER (WHERE e.category = 'running')
      FROM training_items i
      JOIN training_phases p ON p.id = i.training_phase_id
      JOIN training_sessions s ON s.id = p.training_session_id
      JOIN exercises e ON e.id = i.exercise_id
      WHERE s.status <> 'archived'
        AND s.created_at >= current_timestamp - INTERVAL '56 days'
    `);

    const bodyRegionReader = await connection.runAndReadAll(`
      SELECT br.label_de, count(*)
      FROM training_items i
      JOIN training_phases p ON p.id = i.training_phase_id
      JOIN training_sessions s ON s.id = p.training_session_id
      JOIN exercise_body_regions ebr ON ebr.exercise_id = i.exercise_id
      JOIN body_regions br ON br.id = ebr.body_region_id
      WHERE s.status <> 'archived'
        AND s.created_at >= current_timestamp - INTERVAL '56 days'
        AND ebr.emphasis = 'primary'
        AND ebr.body_region_id NOT LIKE 'detail:%'
      GROUP BY br.label_de
      ORDER BY count(*) DESC, br.label_de
      LIMIT 7
    `);

    const usageReader = await connection.runAndReadAll(`
      SELECT
        e.id::VARCHAR,
        COALESCE(t.name, e.canonical_name),
        count(*),
        COALESCE(sum(i.duration_minutes), 0)
      FROM training_items i
      JOIN training_phases p ON p.id = i.training_phase_id
      JOIN training_sessions s ON s.id = p.training_session_id
      JOIN exercises e ON e.id = i.exercise_id
      LEFT JOIN exercise_translations t ON t.exercise_id = e.id AND t.locale = 'de'
      WHERE s.status <> 'archived'
        AND s.created_at >= current_timestamp - INTERVAL '56 days'
      GROUP BY e.id, COALESCE(t.name, e.canonical_name)
      ORDER BY count(*) DESC, COALESCE(sum(i.duration_minutes), 0) DESC, COALESCE(t.name, e.canonical_name)
      LIMIT 6
    `);

    const summary = summaryReader.getRows()[0] ?? [];
    const analytics = analyticsReader.getRows()[0] ?? [];

    return {
      training: {
        total: Number(summary[0] ?? 0),
        draft: Number(summary[1] ?? 0),
        ready: Number(summary[2] ?? 0),
        completed: Number(summary[3] ?? 0),
        totalMinutes: Number(summary[4] ?? 0),
        recent: recentReader.getRows().map((row) => ({
          id: String(row[0]),
          title: String(row[1]),
          status: String(row[2]) as DashboardRecentTraining["status"],
          source: String(row[3]),
          durationMinutes: Number(row[4] ?? 0),
          itemCount: Number(row[5] ?? 0),
          createdAt: String(row[6]),
        })),
        activity: activityReader.getRows().map((row) => ({
          weekStart: String(row[0]),
          count: Number(row[1] ?? 0),
          minutes: Number(row[2] ?? 0),
        })),
        sources: sourceReader.getRows().map((row) => ({
          key: String(row[0]),
          count: Number(row[1] ?? 0),
        })),
      },
      exercises: {
        active: Number(summary[5] ?? 0),
        games: Number(summary[16] ?? 0),
        categories: categoryReader.getRows().map((row) => ({ key: String(row[0]), count: Number(row[1] ?? 0) })),
      },
      groups: {
        active: Number(summary[6] ?? 0),
        withoutTraining: Number(summary[7] ?? 0),
        audiences: audienceReader.getRows().map((row) => ({ key: String(row[0]), count: Number(row[1] ?? 0) })),
      },
      media: {
        total: Number(summary[8] ?? 0),
        generated: Number(summary[9] ?? 0),
        pendingReview: Number(summary[10] ?? 0),
        approved: Number(summary[11] ?? 0),
        failed: Number(summary[12] ?? 0),
        queue: {
          queued: Number(summary[19] ?? 0),
          running: Number(summary[20] ?? 0),
          succeededRecent: Number(summary[21] ?? 0),
          failedRecent: Number(summary[22] ?? 0),
        },
      },
      ai: {
        pendingDrafts: Number(summary[17] ?? 0),
        approvingDrafts: Number(summary[18] ?? 0),
      },
      analytics: {
        distinctExercisesUsed: Number(analytics[0] ?? 0),
        runningMinutes: Number(analytics[1] ?? 0),
        runningItems: Number(analytics[2] ?? 0),
        bodyRegions: bodyRegionReader.getRows().map((row) => ({
          key: String(row[0]),
          count: Number(row[1] ?? 0),
        })),
        topExercises: usageReader.getRows().map((row) => ({
          id: String(row[0]),
          name: String(row[1]),
          uses: Number(row[2] ?? 0),
          minutes: Number(row[3] ?? 0),
        })),
      },
      obstacles: {
        active: Number(summary[13] ?? 0),
        highRisk: Number(summary[14] ?? 0),
        withClubDimensions: Number(summary[15] ?? 0),
      },
    };
  });
}
