BEGIN TRANSACTION;

-- Complete exercise-specific movement facets for the initial strength and OCR seed cohort.
INSERT OR IGNORE INTO exercise_movement_patterns (exercise_id, movement_pattern_id)
SELECT e.id, m.movement_pattern_id
FROM exercises e
JOIN (VALUES
  ('air-squat','squat'),
  ('army-crawl','crawl'),
  ('assisted-pullup','pull'),
  ('band-row','pull'),
  ('bear-crawl','crawl'),
  ('body-row','pull'),
  ('box-jump','jump'),('box-jump','land'),
  ('box-over','jump'),('box-over','land'),
  ('box-stepup','lunge'),
  ('burpee','squat'),('burpee','push'),('burpee','jump'),('burpee','land'),
  ('burpee-stepback','squat'),('burpee-stepback','push'),
  ('cargo-net-climb','climb'),('cargo-net-climb','hang'),
  ('cargo-net-traverse','climb'),('cargo-net-traverse','hang'),('cargo-net-traverse','pull'),
  ('crab-walk','crawl'),
  ('crawl-run-transition','crawl'),('crawl-run-transition','run'),
  ('glute-bridge','hinge'),
  ('hip-hinge-drill','hinge'),
  ('incline-pushup','push'),
  ('incline-wall-run','run'),('incline-wall-run','climb'),
  ('kettlebell-deadlift','hinge'),
  ('kettlebell-goblet-squat','squat'),
  ('knee-pushup','push'),
  ('low-crawl','crawl'),
  ('obstacle-burpee-penalty','squat'),('obstacle-burpee-penalty','push'),
  ('obstacle-burpee-penalty','jump'),('obstacle-burpee-penalty','land'),
  ('over-under','crawl'),('over-under','climb'),
  ('pike-pushup','push'),
  ('pullup','pull'),
  ('pushup','push'),
  ('reverse-lunge','lunge'),
  ('rig-run-interval','run'),('rig-run-interval','hang'),
  ('rope-traverse','climb'),('rope-traverse','hang'),('rope-traverse','pull'),
  ('sandbag-ground-shoulder','hinge'),
  ('sandbag-squat','squat'),
  ('single-leg-glute-bridge','hinge'),
  ('split-squat','lunge'),
  ('tempo-squat','squat'),
  ('walking-lunge','lunge'),('walking-lunge','walk'),
  ('wall-run-transition','run'),('wall-run-transition','climb'),
  ('wall-stepover-low','climb'),('wall-stepover-low','lunge'),
  ('wall-vault-basic','climb'),('wall-vault-basic','jump'),('wall-vault-basic','land')
) AS m(seed_key, movement_pattern_id) ON e.seed_key=m.seed_key;

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (12, 'seed_movement_patterns');

COMMIT;
