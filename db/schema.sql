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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
