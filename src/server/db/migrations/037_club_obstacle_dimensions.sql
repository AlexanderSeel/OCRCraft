BEGIN TRANSACTION;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS club_obstacle_height_cm DECIMAL(8,2);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS club_obstacle_span_cm DECIMAL(8,2);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS club_obstacle_reach_cm DECIMAL(8,2);
INSERT INTO schema_migrations (version,name) VALUES (37,'club_obstacle_dimensions');
COMMIT;
