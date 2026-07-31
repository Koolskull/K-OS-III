-- Apply on existing kos_dev databases that already ran the earlier schema.
-- Fresh installs only need db/schema.sql.

CREATE TABLE IF NOT EXISTS kooldraw_projects (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  thumbnail_url TEXT,
  project_data BYTEA NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kooldraw_projects_owner ON kooldraw_projects(owner_id);

ALTER TABLE user_assets ADD COLUMN IF NOT EXISTS kooldraw_project_id INTEGER REFERENCES kooldraw_projects(id) ON DELETE CASCADE;
