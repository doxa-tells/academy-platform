import "server-only";
import { createRequire } from "node:module";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzleNeon<typeof schema>>;

function createDb(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  if (url.startsWith("pglite:")) {
    // Local development only. Module names are kept in variables so the
    // production bundle never traces PGlite.
    const req = createRequire(import.meta.url);
    const pgliteName = "@electric-sql/pglite";
    const driverName = "drizzle-orm/pglite";
    const { PGlite } = req(pgliteName);
    const { drizzle } = req(driverName);
    const client = new PGlite(url.slice("pglite:".length));
    return drizzle(client, { schema }) as unknown as DB;
  }

  return drizzleNeon(neon(url), { schema });
}

const globalForDb = globalThis as unknown as { __academyDb?: DB };

function getDb(): DB {
  if (!globalForDb.__academyDb) globalForDb.__academyDb = createDb();
  return globalForDb.__academyDb;
}

// Lazy proxy: the connection is created on first use, never at import time
// (keeps `next build` from opening the database).
export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export { schema };
