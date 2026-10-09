import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, key) });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: sql`now()` } });
}

export async function deleteSetting(key: string) {
  await db.delete(schema.settings).where(eq(schema.settings.key, key));
}

export function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
