BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS user_exercise_favorites (
  user_id UUID NOT NULL REFERENCES app_users(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (user_id,exercise_id)
);

CREATE INDEX IF NOT EXISTS user_exercise_favorites_user_idx
  ON user_exercise_favorites(user_id,created_at);

INSERT INTO schema_migrations (version,name)
VALUES (66,'user_exercise_favorites');

COMMIT;
