-- Apply on existing kos_dev databases that already ran the earlier schema.
-- Fresh installs only need db/schema.sql.

CREATE TABLE IF NOT EXISTS datamoshpit_renders (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  kind VARCHAR(10) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  duration_seconds NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS datamoshpit_renders_owner ON datamoshpit_renders(owner_id);
CREATE INDEX IF NOT EXISTS datamoshpit_renders_owner_created ON datamoshpit_renders(owner_id, created_at);

ALTER TABLE user_assets ADD COLUMN IF NOT EXISTS datamoshpit_render_id INTEGER REFERENCES datamoshpit_renders(id) ON DELETE CASCADE;
