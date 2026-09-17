BEGIN TRANSACTION;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS route_name VARCHAR;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS route_distance_metres DECIMAL(10,2);
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS route_surface VARCHAR;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS route_gps_reference VARCHAR;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS route_notes VARCHAR;
INSERT INTO schema_migrations (version,name) VALUES (39,'training_route_metadata');
COMMIT;
