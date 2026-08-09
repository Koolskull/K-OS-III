-- K-OS III — accounts schema (see docs/ACCOUNTS_SPEC.md)
--
-- users / accounts / sessions / verification_token match the exact shape
-- @auth/pg-adapter's queries expect (see node_modules/@auth/pg-adapter/index.js
-- for the authoritative query list). Do not rename these columns.
--
-- password_hash and the profiles table are this project's own additions on
-- top of that — Auth.js itself has no opinion on password-based credentials
-- or public profile data.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  -- Credentials-provider password auth. NULL for accounts that only ever
  -- sign in via a future OAuth/wallet method once those exist.
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Public-facing profile data, kept separate from the Auth.js-owned `users`
-- table on purpose — this is the part users see and edit as their portfolio
-- (docs/ACCOUNTS_SPEC.md § 6, phase 4), while `users` stays Auth.js's own
-- internal shape.
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  -- Per-field contact visibility on public profiles (off by default).
  -- Whole-profile is_public is still the master switch.
  show_email BOOLEAN NOT NULL DEFAULT false,
  show_ethereum BOOLEAN NOT NULL DEFAULT false,
  show_matrix BOOLEAN NOT NULL DEFAULT false,
  -- Cached primary ENS; only set if it reverse/forward-resolves to a linked wallet.
  ens_name VARCHAR(255),
  show_ens BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Custom public profile content: text, image/gif URLs, YouTube (video id only),
-- allowlisted iframes. All payloads are server-sanitized (src/lib/profile-sanitize.ts).
CREATE TABLE IF NOT EXISTS profile_blocks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  block_type VARCHAR(32) NOT NULL, -- 'text' | 'image' | 'gif' | 'youtube' | 'iframe'
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_blocks_user_sort ON profile_blocks(user_id, sort_order);

-- Lightweight server notes (NOT Matrix, NOT XMTP). Text-only, 48h TTL.
-- No images/videos. Keep the K-OS server thin — real chat lives on Matrix/XMTP.
CREATE TABLE IF NOT EXISTS chat_ephemeral_threads (
  id SERIAL PRIMARY KEY,
  kind VARCHAR(16) NOT NULL DEFAULT 'dm', -- 'dm' | 'group'
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

-- ─────────────────────────────────────────────────────────────────────────
-- PRODEV — production credits & residuals (see docs/ACCOUNTS_SPEC.md § 4.2,
-- prodev/ARCHITECTURE.md). Real implementation of prodev/src/core/types.ts's
-- Project/Shot/ChecklistItem model, now keyed to real users instead of
-- free-form strings. blockchain_ref is unused for now — a future signed-
-- attestation-log root, once § 4.1's offline design is built.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prodev_projects (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  blockchain_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Everyone who can see/edit a project — the owner is implicitly a member
-- too (added on project creation) so membership checks are always a single
-- join, not owner-or-member branching everywhere.
CREATE TABLE IF NOT EXISTS prodev_members (
  project_id INTEGER NOT NULL REFERENCES prodev_projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'contributor', -- 'owner' | 'contributor'
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS prodev_shots (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES prodev_projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nested checklist items, tree via parent_id. A shot's checklist is every
-- item with that shot_id; nesting is parent_id within the same shot.
CREATE TABLE IF NOT EXISTS prodev_checklist_items (
  id SERIAL PRIMARY KEY,
  shot_id INTEGER NOT NULL REFERENCES prodev_shots(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES prodev_checklist_items(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'todo', -- 'todo' | 'in-progress' | 'done'
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  contribution_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Goal vs. actual completion, so early/late can be computed
  -- (completed_at - scheduled_at). `status` stays the source of truth for
  -- done/not-done; completed_at is just a timestamp of when.
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clock-in/clock-out sessions against a checklist item. An open entry
-- (clock_out IS NULL) is "currently clocked in". Logged hours = sum of
-- (clock_out - clock_in) across all entries for an item, shown alongside
-- (not replacing) the manual `hours` estimate above.
CREATE TABLE IF NOT EXISTS prodev_time_entries (
  id SERIAL PRIMARY KEY,
  checklist_item_id INTEGER NOT NULL REFERENCES prodev_checklist_items(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS prodev_time_entries_item ON prodev_time_entries(checklist_item_id);
CREATE INDEX IF NOT EXISTS prodev_time_entries_open ON prodev_time_entries(user_id, checklist_item_id) WHERE clock_out IS NULL;

-- Linked file paths (ChecklistItem.assets in prodev/src/core/types.ts).
CREATE TABLE IF NOT EXISTS prodev_checklist_item_assets (
  item_id INTEGER NOT NULL REFERENCES prodev_checklist_items(id) ON DELETE CASCADE,
  asset_path TEXT NOT NULL,
  PRIMARY KEY (item_id, asset_path)
);

-- The finalized/editable credit split for a shot (Shot.credits in
-- prodev/src/core/types.ts) — distinct from a checklist item's own
-- contribution_percent, which is per-task, not the agreed-upon final split.
CREATE TABLE IF NOT EXISTS prodev_shot_credits (
  shot_id INTEGER NOT NULL REFERENCES prodev_shots(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  percent NUMERIC(5,2) NOT NULL CHECK (percent >= 0 AND percent <= 100),
  PRIMARY KEY (shot_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- SHOTLIST — persisted sequences/shots, direct Postgres mirror of the
-- in-memory Sequence/Shot shape in src/components/apps/shotlist/
-- shotlistShared.ts. Optionally linked to a PRODEV project/shot so the two
-- apps can reference the same production. Not real-time — the UI explicitly
-- saves/loads, same as every other app in this project.
-- ─────────────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────────────
-- KOOLDRAW — persisted, individually-addressable projects. project_data is
-- the exact zip format serializeProjectToBundleZip (src/lib/SpriteUtils.ts)
-- already produces for the "BUNDLE" export — save/load reuse that same
-- serializer/deserializer instead of a second data shape.
-- ─────────────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────────────
-- DATAMOSHPIT RENDERS — bounce-to-file output (real-time capture, see
-- src/lib/datamoshpit/renderCapture.ts + src/engine/audio/AudioEngine.ts's
-- getRecordingStream). Stored on disk (public/uploads/, like plain asset
-- uploads), not as bytea — these can be multi-minute audio/video files.
-- Playable standalone at /render/[id] (script-free <audio>/<video> tag),
-- embeddable same-origin via a plain <iframe>.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS datamoshpit_renders (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  kind VARCHAR(10) NOT NULL, -- 'audio' | 'video'
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  duration_seconds NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS datamoshpit_renders_owner ON datamoshpit_renders(owner_id);
-- Per-user rate limiting (N renders/hour) checks recent rows here directly —
-- no separate rate-limit table needed.
CREATE INDEX IF NOT EXISTS datamoshpit_renders_owner_created ON datamoshpit_renders(owner_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────
-- ASSET LIBRARY — unified per-user registry of importable creative output
-- (KoolDraw drawings, Datamoshpit renders, plain image/audio uploads),
-- attachable to a Shotlist shot so any app focused on that shot can offer
-- it. `kind` selects which of the type-specific columns is set; exactly one
-- of kooldraw_project_id/datamoshpit_render_id/file_path is non-null.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_assets (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind VARCHAR(32) NOT NULL, -- 'kooldraw_project' | 'datamoshpit_render' | 'image' | 'audio'
  title VARCHAR(255) NOT NULL,
  thumbnail_url TEXT,
  file_path TEXT, -- server-stored path, for plain image/audio uploads
  kooldraw_project_id INTEGER REFERENCES kooldraw_projects(id) ON DELETE CASCADE,
  datamoshpit_render_id INTEGER REFERENCES datamoshpit_renders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_assets_owner ON user_assets(owner_id);

CREATE TABLE IF NOT EXISTS shotlist_shot_assets (
  shot_id INTEGER NOT NULL REFERENCES shotlist_shots(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES user_assets(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shot_id, asset_id)
);
