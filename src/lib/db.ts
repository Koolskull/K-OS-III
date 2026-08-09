/*
 *                    ☦
 *        ACCOUNTS — DATABASE CLIENT
 *
 *   Shared pg Pool for the accounts system (see docs/ACCOUNTS_SPEC.md).
 *   Local dev points at docker-compose.dev.yml's Postgres; production points
 *   at the project's own self-hosted Postgres via DATABASE_URL.
 *
 *   Pool creation is LAZY: importing this module during `next build` (page-
 *   data collection for /api/*) must not require DATABASE_URL. CI static
 *   export and local `next build` without env must still compile. The first
 *   actual query at runtime throws if DATABASE_URL is missing.
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

function getPool(): Pool {
  if (!globalThis.__kosPgPool) {
    globalThis.__kosPgPool = createPool();
  }
  return globalThis.__kosPgPool;
}

/**
 * Drop-in Pool. Lazy via Proxy so `import { pool } from "@/lib/db"` during
 * build does not open a connection or require env.
 */
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop, _receiver) {
    const real = getPool();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
  set(_target, prop, value) {
    return Reflect.set(getPool(), prop, value);
  },
  has(_target, prop) {
    return Reflect.has(getPool(), prop);
  },
});
