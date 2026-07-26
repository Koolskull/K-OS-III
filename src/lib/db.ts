/*
 *                    ☦
 *        ACCOUNTS — DATABASE CLIENT
 *
 *   Shared pg Pool for the accounts system (see docs/ACCOUNTS_SPEC.md).
 *   Local dev points at docker-compose.dev.yml's Postgres; production points
 *   at the project's own self-hosted Postgres via DATABASE_URL.
 */

import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __kosPgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — see .env.local.example");
  }
  return new Pool({ connectionString });
}

/** Reused across hot-reloads in dev so we don't leak a new pool per reload. */
export const pool = global.__kosPgPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  global.__kosPgPool = pool;
}
