// Session token helpers. Edge-safe (no DB, no Node APIs) so proxy.ts can use them.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "academy_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = { uid: string; role: "admin" | "student"; v: number };

let cachedKey: Uint8Array | null = null;

/** SESSION_SECRET if set; otherwise a key derived from the (secret) database URL. */
async function secret() {
  if (cachedKey) return cachedKey;
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) {
    cachedKey = new TextEncoder().encode(s);
  } else {
    const base = process.env.DATABASE_URL;
    if (!base) throw new Error("SESSION_SECRET or DATABASE_URL must be set");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`academy-session:${base}`));
    cachedKey = new Uint8Array(digest);
  }
  return cachedKey;
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(await secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await secret());
    if (typeof payload.uid !== "string") return null;
    if (payload.role !== "admin" && payload.role !== "student") return null;
    return { uid: payload.uid, role: payload.role, v: Number(payload.v) || 1 };
  } catch {
    return null;
  }
}
