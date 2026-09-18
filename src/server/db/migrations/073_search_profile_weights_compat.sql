ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS summary_weight INTEGER DEFAULT 20;
ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS taxonomy_weight INTEGER DEFAULT 25;
ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS body_regions_weight INTEGER DEFAULT 25;
ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS equipment_weight INTEGER DEFAULT 20;
ALTER TABLE search_profiles ADD COLUMN IF NOT EXISTS instructions_weight INTEGER DEFAULT 10;
UPDATE search_profiles SET summary_weight=COALESCE(summary_weight,20), taxonomy_weight=COALESCE(taxonomy_weight,25), body_regions_weight=COALESCE(body_regions_weight,25), equipment_weight=COALESCE(equipment_weight,20), instructions_weight=COALESCE(instructions_weight,10);
INSERT INTO schema_migrations(version,name) VALUES (73,'search_profile_weights_compat');
