-- Apply on existing kos_dev databases that already ran the earlier schema.
-- Fresh installs only need db/schema.sql.

CREATE TABLE IF NOT EXISTS shotlist_sequences (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES prodev_projects(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  fps INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shotlist_shots (
  id SERIAL PRIMARY KEY,
  sequence_id INTEGER NOT NULL REFERENCES shotlist_sequences(id) ON DELETE CASCADE,
  prodev_shot_id INTEGER REFERENCES prodev_shots(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_frames INTEGER NOT NULL DEFAULT 24,
  audio_notes TEXT NOT NULL DEFAULT '',
  bg VARCHAR(10) NOT NULL DEFAULT 'white',
  orientation VARCHAR(10) NOT NULL DEFAULT 'landscape',
  plate_w INTEGER NOT NULL,
  plate_h INTEGER NOT NULL,
  thumbnail_url TEXT,
  has_committed_thumbnail BOOLEAN NOT NULL DEFAULT false,
  xsheet JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(10) NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS shotlist_shots_sequence ON shotlist_shots(sequence_id);

CREATE TABLE IF NOT EXISTS user_assets (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  thumbnail_url TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_assets_owner ON user_assets(owner_id);

CREATE TABLE IF NOT EXISTS shotlist_shot_assets (
  shot_id INTEGER NOT NULL REFERENCES shotlist_shots(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES user_assets(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shot_id, asset_id)
);
