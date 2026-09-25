BEGIN TRANSACTION;

-- A blocked environment review is itself the final catalog decision for
-- exercises whose provider data only identifies a generic/ambiguous machine.
-- Do not invent a portable resistance line. Keep the source record archived,
-- explicitly classify it as Fitnessstudio and close the pending review as a
-- catalog-level block decision.
INSERT OR IGNORE INTO tags (id,label_de,label_en)
VALUES ('fitnessstudio','Fitnessstudio','Gym');

INSERT OR IGNORE INTO exercise_tags (exercise_id,tag_id)
SELECT r.exercise_id,'fitnessstudio'
FROM exercise_environment_reviews r
WHERE r.disposition='blocked';

UPDATE exercises
SET archived=true,
    outdoor_suitable=false,
    updated_at=current_timestamp
WHERE id IN (
  SELECT exercise_id
  FROM exercise_environment_reviews
  WHERE disposition='blocked'
);

UPDATE exercise_environment_reviews
SET review_status='catalog',
    reviewed_by=NULL,
    reviewed_at=current_timestamp,
    reason=CASE
      WHEN trim(COALESCE(reason,''))=''
        THEN 'Fitnessstudio-/Maschinenabhängigkeit ohne verlässlich ableitbare portable Widerstandslinie; als Studioübung blockiert.'
      WHEN lower(reason) LIKE '%manuelle fachprüfung%'
        THEN 'Fitnessstudio-/Maschinenabhängigkeit ohne verlässlich ableitbare portable Widerstandslinie; als Studioübung blockiert.'
      ELSE reason
    END,
    replacement_equipment=''
WHERE disposition='blocked'
  AND COALESCE(review_status,'catalog')='pending';

DELETE FROM exercise_outdoor_variant_equipment
WHERE exercise_id IN (
  SELECT exercise_id
  FROM exercise_environment_reviews
  WHERE disposition='blocked'
);

INSERT OR IGNORE INTO schema_migrations (version,name)
VALUES (89,'finalize_blocked_studio_reviews');

COMMIT;
