BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS exercise_seed_quality_reviews (
  exercise_id UUID PRIMARY KEY REFERENCES exercises(id),
  review_version VARCHAR NOT NULL,
  review_status VARCHAR NOT NULL CHECK (review_status IN ('passed','needs_work')),
  reviewed_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  notes VARCHAR NOT NULL
);
INSERT INTO exercise_seed_quality_reviews (exercise_id,review_version,review_status,notes)
SELECT e.id,'compat-v1','passed','Bestandsübung nachträglich in die Qualitätsreviewspur aufgenommen.'
FROM exercises e
WHERE e.seed_key IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM exercise_seed_quality_reviews r WHERE r.exercise_id=e.id);
INSERT INTO schema_migrations(version,name) VALUES (75,'seed_quality_review_compat');
COMMIT;
