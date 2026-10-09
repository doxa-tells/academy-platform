import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "node:crypto";
import { db, schema } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";
import type { User } from "./db/schema";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, session.uid) });
  if (!user || !user.active || user.sessionVersion !== session.v) return null;

  // Track activity for the "who is falling behind" report (at most every 5 minutes).
  const now = Date.now();
  if (!user.lastSeenAt || now - user.lastSeenAt.getTime() > 5 * 60 * 1000) {
    await db.update(schema.users).set({ lastSeenAt: new Date(now) }).where(eq(schema.users.id, user.id));
  }
  return user;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

export async function requireStudent(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "student") redirect("/admin");
  return user;
}

export async function setSessionCookie(user: User) {
  const token = await signSession({ uid: user.id, role: user.role, v: user.sessionVersion });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

const WORDS = [
  "luna", "kite", "mango", "river", "cedar", "pixel", "amber", "tiger", "cloud", "maple",
  "comet", "lotus", "coral", "ember", "frost", "olive", "plume", "stone", "spark", "zebra",
];

/** Readable random password like "kite-4821-moon". */
export function generatePassword() {
  const w = () => WORDS[randomInt(WORDS.length)];
  return `${w()}-${randomInt(1000, 10000)}-${w()}`;
}

export function generateLinkCode() {
  return randomBytes(9).toString("base64url");
}
