import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { assessPlanningMetadata } from "../src/domain/training/planning-eligibility.ts";
import { auditLocalMediaFiles } from "../src/server/media/local-media-file-audit.ts";
import { DuckDBInstance } from "@duckdb/node-api";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());
const outputDirectory = path.resolve("artifacts/startup-catalog-audit");
await mkdir(outputDirectory, { recursive: true });
const paths = [...new Set([path.resolve("data/ocrcraft.initial.duckdb"), path.resolve(process.env.OCRCRAFT_DB_PATH ?? "data/ocrcraft.duckdb")])];
const reports = [];
const auditedAt = new Date().toISOString();
// Match the application's numbered SQL migration convention without executing migrations.
const expectedVersions = (await readdir(path.resolve("src/server/db/migrations")))
  .filter((name) => /^\d{3}_.*\.sql$/.test(name)).map((name) => Number(name.slice(0, 3))).sort((a, b) => a - b);
if (new Set(expectedVersions).size !== expectedVersions.length) throw new Error("Duplicate migration versions in source inventory.");
for (const databasePath of paths) {
  const db = await DuckDBInstance.create(databasePath, { access_mode: "READ_ONLY" });
  const connection = await db.connect();
  const rows = async (sql) => (await connection.runAndReadAll(sql)).getRowObjectsJson();
  try {
    const appliedVersions = (await rows("SELECT version FROM schema_migrations ORDER BY version")).map((row) => Number(row.version));
    const migrationInventory = {
      expectedCount: expectedVersions.length,
      appliedCount: appliedVersions.length,
      missingVersions: expectedVersions.filter((version) => !appliedVersions.includes(version)),
      unexpectedVersions: appliedVersions.filter((version) => !expectedVersions.includes(version)),
    };
    const searchDocuments = [];
    for (const locale of ["de", "en"]) {
      const coverage = (await rows(`SELECT
        (SELECT count(*) FROM search_documents_${locale}) AS documents,
        (SELECT count(*) FROM exercises e WHERE NOT e.archived AND NOT EXISTS (
          SELECT 1 FROM search_documents_${locale} d WHERE d.entity_type='exercise' AND d.entity_id=e.id::VARCHAR
        )) AS active_exercises_without_document`))[0];
      const state = (await rows(`SELECT status,indexed_document_count FROM search_index_state WHERE locale='${locale}'`))[0] ?? null;
      // Do not export last_error, which may contain private runtime details.
      searchDocuments.push({ locale, ...coverage, state });
    }
    const counts = (await rows(`SELECT
      (SELECT count(*) FROM exercises) AS exercises,
      (SELECT count(*) FROM exercises WHERE NOT archived) AS active_exercises,
      (SELECT count(*) FROM app_users) AS users,
      (SELECT count(*) FROM training_sessions) AS sessions,
      (SELECT count(*) FROM club_groups) AS club_groups,
      (SELECT count(*) FROM club_youth_safety_profiles) AS youth_profiles,
      (SELECT count(*) FROM app_auth_settings WHERE COALESCE(club_access_code,'')<>'') AS configured_access_codes,
      (SELECT count(*) FROM external_import_sources WHERE COALESCE(encrypted_api_key,'')<>'') AS external_import_credentials,
      (SELECT count(*) FROM ai_provider_instances) AS provider_instances,
      (SELECT count(*) FROM ai_exercise_drafts) AS ai_drafts,
      (SELECT count(*) FROM app_task_queue) AS tasks,
      (SELECT max(version) FROM schema_migrations) AS migration_version`))[0];
    const inventory = await rows(`SELECT e.id::VARCHAR AS id,e.seed_key,e.canonical_name,t.name AS name_de,e.exercise_type,e.category,e.archived,
      e.min_age,e.risk_level,e.suitable_for_kids,e.suitable_for_youth,e.suitable_for_adults,e.indoor_suitable,e.outdoor_suitable,
      COALESCE(pd.station_capacity,e.station_capacity) AS station_capacity,e.supervision,e.surface_requirements,
      (SELECT list(g.goal) FROM exercise_training_goals g WHERE g.exercise_id=e.id) AS training_goals,
      (SELECT list(m.movement_pattern_id) FROM exercise_movement_patterns m WHERE m.exercise_id=e.id) AS movement_patterns,
      (SELECT count(*) FROM exercise_training_goals g WHERE g.exercise_id=e.id) AS goal_count,
      (SELECT count(*) FROM exercise_movement_patterns m WHERE m.exercise_id=e.id) AS movement_count,
      (SELECT count(*) FROM exercise_media_assets m WHERE m.exercise_id=e.id AND m.review_status='approved') AS approved_media_count,
      r.disposition AS outdoor_disposition,r.review_status AS outdoor_review_status,
      q.review_status AS content_review_status,q.review_version AS content_review_version
      FROM exercises e LEFT JOIN exercise_translations t ON t.exercise_id=e.id AND t.locale='de'
      LEFT JOIN exercise_environment_reviews r ON r.exercise_id=e.id
      LEFT JOIN exercise_details pd ON pd.exercise_id=e.id AND pd.locale='de'
      LEFT JOIN exercise_seed_quality_reviews q ON q.exercise_id=e.id ORDER BY e.seed_key NULLS LAST,e.canonical_name`);
    const media = await rows(`SELECT m.id::VARCHAR AS id,m.exercise_id::VARCHAR AS exercise_id,t.name AS expected_name_de,
      m.review_status,m.biomechanics_review,m.text_match_review,m.is_primary,m.source_type,m.illustration_format,
      m.storage_provider,m.storage_key,m.storage_uri,m.sha256,m.generation_prompt,m.rights_status,
      d.start_position,d.safety_notes,d.quality_criteria
      FROM exercise_media_assets m LEFT JOIN exercise_translations t ON t.exercise_id=m.exercise_id AND t.locale='de'
      LEFT JOIN exercise_details d ON d.exercise_id=m.exercise_id AND d.locale='de' ORDER BY m.exercise_id,m.id`);
    const localMediaAudit = await auditLocalMediaFiles(media, path.resolve("public"));
    for (const asset of media) {
      Object.assign(asset, localMediaAudit.observations[asset.id]);
      // Export local paths, not potentially credential-bearing remote URLs.
      if (!asset.storage_uri?.startsWith("/generated/exercises/")) asset.storage_uri = null;
    }
    const duplicates = await rows(`SELECT lower(trim(canonical_name)) AS normalized_name,count(*) AS count,list(id::VARCHAR) AS exercise_ids
      FROM exercises WHERE NOT archived GROUP BY 1 HAVING count(*)>1 ORDER BY count(*) DESC,1`);
    const orphans = (await rows(`SELECT
      (SELECT count(*) FROM exercise_media_assets m LEFT JOIN exercises e ON e.id=m.exercise_id WHERE e.id IS NULL) AS media,
      (SELECT count(*) FROM exercise_translations t LEFT JOIN exercises e ON e.id=t.exercise_id WHERE e.id IS NULL) AS translations,
      (SELECT count(*) FROM training_items i LEFT JOIN exercises e ON e.id=i.exercise_id WHERE i.exercise_id IS NOT NULL AND e.id IS NULL) AS training_items`))[0];
    for (const item of inventory) {
      item.planning_metadata_issues_mixed = assessPlanningMetadata({
        minAge: item.min_age, riskLevel: item.risk_level,
        suitableForKids: item.suitable_for_kids, suitableForYouth: item.suitable_for_youth, suitableForAdults: item.suitable_for_adults,
        indoorSuitable: item.indoor_suitable, outdoorSuitable: item.outdoor_suitable, stationCapacity: item.station_capacity,
        trainingGoals: item.training_goals ?? [], movementPatterns: item.movement_patterns ?? [],
      }, "mixed", "mixed");
    }
    const active = inventory.filter((item) => !item.archived);
    const nonRejectedMediaIds = new Set(media.filter((item)=>item.review_status!=='rejected').map((item)=>item.id));
    const byType = Object.fromEntries([...new Set(active.map((item) => item.exercise_type))].sort().map((type) => [type,active.filter((item) => item.exercise_type===type).length]));
    const summary = { auditedAt, accessMode: "READ_ONLY", databasePath, counts, byType, activeWithoutMinimumAge: active.filter((item)=>item.min_age==null).length,
      activeWithoutGoals: active.filter((item)=>Number(item.goal_count)===0).length,
      activeWithoutMovementPatterns: active.filter((item)=>Number(item.movement_count)===0).length,
      activeWithoutApprovedMedia: active.filter((item)=>Number(item.approved_media_count)===0).length,
      metadataEligibleForMixedPlanning:active.filter((item)=>item.planning_metadata_issues_mixed.length===0).length,
      metadataEligibilityScope:"DE capacity; mixed audience/location; not content approval",
      mediaCount:media.length, pendingMedia:media.filter((item)=>item.review_status==='pending').length,
      approvedMediaWithoutBothChecks:media.filter((item)=>item.review_status==='approved'&&(item.biomechanics_review!=='pass'||item.text_match_review!=='pass')).length,
      missingLocalMediaFiles:media.filter((item)=>item.local_file_exists===false).length,
      localMediaChecksumMismatches:media.filter((item)=>item.local_file_integrity==='checksum_mismatch').length,
      nonRejectedLocalMediaChecksumMismatches:media.filter((item)=>item.local_file_integrity==='checksum_mismatch'&&item.review_status!=='rejected').length,
      retiredLocalMediaChecksumMismatches:media.filter((item)=>item.local_file_integrity==='checksum_mismatch'&&item.review_status==='rejected').length,
      localMediaWithoutRecordedHash:media.filter((item)=>item.local_file_integrity==='missing_recorded_hash').length,
      localMediaInvalidOrUnreadable:media.filter((item)=>['invalid_path','unreadable'].includes(item.local_file_integrity)).length,
      sharedLocalMediaFileGroups:localMediaAudit.sharedLocalFileGroups.length,
      nonRejectedSharedLocalMediaFileGroups:localMediaAudit.sharedLocalFileGroups.filter((group)=>group.assetIds.filter((id)=>nonRejectedMediaIds.has(id)).length>1).length,
      duplicateNameGroups:duplicates.length, orphans, migrationInventory, searchDocuments };
    const name = path.basename(databasePath).replace(/\W/g,"_");
    await writeFile(path.join(outputDirectory,`${name}.json`),JSON.stringify({ summary, inventory, media, duplicates, sharedLocalMediaFiles: localMediaAudit.sharedLocalFileGroups },null,2)+"\n");
    reports.push(summary);
  } finally { connection.closeSync(); db.closeSync(); }
}
await writeFile(path.join(outputDirectory,"summary.json"),JSON.stringify(reports,null,2)+"\n");
console.log(JSON.stringify(reports,null,2));
