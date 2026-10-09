import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { checkPassword, setSessionCookie } from "@/lib/auth";

const MAX_FAILS = 8;
const LOCK_MINUTES = 15;

function back(req: NextRequest, error: string, login: string) {
  const url = new URL("/login", req.url);
  url.searchParams.set("error", error);
  if (login) url.searchParams.set("login", login);
  return NextResponse.redirect(url, 303);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const login = String(form.get("login") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "");

  if (!login || !password) return back(req, "empty", login);

  const user = await db.query.users.findFirst({ where: eq(schema.users.login, login) });
  if (!user || !user.active) return back(req, "invalid", login);

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) return back(req, "locked", login);

  const ok = await checkPassword(password, user.passwordHash);
  if (!ok) {
    const fails = user.failedLogins + 1;
    await db
      .update(schema.users)
      .set(
        fails >= MAX_FAILS
          ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60000) }
          : { failedLogins: fails },
      )
      .where(eq(schema.users.id, user.id));
    return back(req, fails >= MAX_FAILS ? "locked" : "invalid", login);
  }

  await db
    .update(schema.users)
    .set({ failedLogins: 0, lockedUntil: null, lastSeenAt: new Date() })
    .where(eq(schema.users.id, user.id));
  await setSessionCookie(user);

  const home = user.role === "admin" ? "/admin" : "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const target = safeNext && (user.role === "admin" || !safeNext.startsWith("/admin")) ? safeNext : home;
  return NextResponse.redirect(new URL(target, req.url), 303);
}
