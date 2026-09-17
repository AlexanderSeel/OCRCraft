BEGIN TRANSACTION;

INSERT OR IGNORE INTO body_regions (id, label_de, label_en) VALUES
  ('serratus', 'Vorderer Sägemuskel', 'Serratus Anterior');

INSERT OR IGNORE INTO schema_migrations (version, name)
VALUES (23, 'serratus_region');

COMMIT;
