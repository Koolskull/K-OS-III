-- Apply on existing kos_dev databases that already ran the earlier schema.
-- Fresh installs only need db/schema.sql.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_ethereum BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_matrix BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS profile_blocks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  block_type VARCHAR(32) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_blocks_user_sort ON profile_blocks(user_id, sort_order);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ens_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_ens BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS chat_ephemeral_threads (
  id SERIAL PRIMARY KEY,
  kind VARCHAR(16) NOT NULL DEFAULT 'dm',
  title VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_ephemeral_members (
  thread_id INTEGER NOT NULL REFERENCES chat_ephemeral_threads(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_ephemeral_messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES chat_ephemeral_threads(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_ephemeral_messages_thread_exp
  ON chat_ephemeral_messages(thread_id, expires_at);
CREATE INDEX IF NOT EXISTS chat_ephemeral_messages_expires
  ON chat_ephemeral_messages(expires_at);
