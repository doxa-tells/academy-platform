import { NextResponse, type NextRequest } from "next/server";
import { runDaily } from "@/lib/daily";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const summary = await runDaily();
  return NextResponse.json({ ok: true, ...summary });
}
