BEGIN TRANSACTION;

-- ExerciseDB remains a review reference. No external instruction or media is copied.
INSERT INTO exercise_source_references (
  exercise_id, provider, title, source_url, source_type, license_label, notes
)
SELECT e.id, v.provider, v.title, v.source_url, 'reference', v.license_label, v.notes
FROM exercises e
JOIN (VALUES
  ('hanging-straight-leg-raise', 'ExerciseDB', 'ExerciseDB candidate: hanging straight leg raise with elevated',
   'https://static.exercisedb.dev/api/exercise/6vcvsLS', 'External reference only',
   'Reviewed as a related candidate; OCRCraft DE/EN coaching, safety and progression fields are original.'),
  ('hanging-pike', 'ExerciseDB', 'ExerciseDB candidate: hanging pike with intense',
   'https://static.exercisedb.dev/api/exercise/gdPIyyO', 'External reference only',
   'Reviewed as a related candidate; OCRCraft DE/EN coaching, safety and progression fields are original.'),
  ('hanging-oblique-knee-raise', 'ExerciseDB', 'ExerciseDB candidate: firm style hanging oblique knee raise',
   'https://static.exercisedb.dev/api/exercise/lFBTISi', 'External reference only',
   'Reviewed as a related candidate; OCRCraft DE/EN coaching, safety and progression fields are original.'),
  ('battle-rope-waves', 'ExerciseDB', 'ExerciseDB candidate: athletic style battling ropes',
   'https://static.exercisedb.dev/api/exercise/hVzPY5j', 'External reference only',
   'Reviewed as a related candidate; OCRCraft DE/EN coaching, safety and progression fields are original.')
) AS v(seed_key, provider, title, source_url, license_label, notes) ON e.seed_key=v.seed_key
WHERE NOT EXISTS (
  SELECT 1 FROM exercise_source_references r
  WHERE r.exercise_id=e.id AND r.source_url=v.source_url
);

UPDATE exercise_seed_quality_reviews r
SET review_version='2026-09-ocr-candidate-provenance-v1',
    notes=concat(r.notes, ' Candidate provenance reviewed; external records remain reference-only and canonical bilingual coaching and safety fields are OCRCraft-authored.')
FROM exercises e
WHERE r.exercise_id=e.id
  AND e.seed_key IN ('hanging-straight-leg-raise','hanging-pike','hanging-oblique-knee-raise','battle-rope-waves')
  AND r.review_status='passed'
  AND r.review_version<>'2026-09-ocr-candidate-provenance-v1';

INSERT INTO schema_migrations(version,name) VALUES (83,'ocr_candidate_provenance');
COMMIT;
