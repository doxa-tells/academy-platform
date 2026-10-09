import { NextResponse, type NextRequest } from "next/server";
import { runDaily } from "@/lib/daily";

export const maxDuration = 60;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) return req.headers.get("authorization") === `Bearer ${secret}`;
  // Without CRON_SECRET Vercel Cron sends no auth header — accept its scheduler only.
  // Worst case of a spoofed call: reminders are deduplicated, the teacher gets an extra digest.
  return (req.headers.get("user-agent") || "").startsWith("vercel-cron");
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const summary = await runDaily();
  return NextResponse.json({ ok: true, ...summary });
}
