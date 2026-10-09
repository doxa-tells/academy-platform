import { NextResponse, type NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { STORAGE_MODE } from "@/lib/config";
import { getBotToken, getBotUsername, tgCall } from "@/lib/telegram";
import { getSetting, appUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authorized = !!process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  const result: Record<string, unknown> = { ok: true };
  try {
    const res = await db.execute(sql`select (select count(*)::int from users) as users, (select count(*)::int from modules) as modules`);
    result.db = "ok";
    if (authorized) result.counts = (res as unknown as { rows: unknown[] }).rows[0];
  } catch (e) {
    result.ok = false;
    result.db = authorized ? String(e) : "error";
  }
  result.storage = STORAGE_MODE === "local" ? "local" : process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "blob-missing-token";
  if (STORAGE_MODE !== "local" && !process.env.BLOB_READ_WRITE_TOKEN) result.ok = false;

  if (authorized) {
    result.appUrl = appUrl();
    const token = await getBotToken();
    result.telegram = token ? { username: await getBotUsername(), webhookSecretSet: !!(await getSetting("telegram_webhook_secret")) } : "not-configured";
    if (token && req.nextUrl.searchParams.get("deep") === "1") {
      const info = await tgCall<{ url: string; last_error_message?: string; pending_update_count: number }>(token, "getWebhookInfo", {});
      result.webhook = info.result ?? info.description;
    }
    if (req.nextUrl.searchParams.get("deep") === "1" && STORAGE_MODE !== "local" && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put, del } = await import("@vercel/blob");
        const blob = await put(`health/check-${Date.now()}.txt`, "ok", { access: "public", addRandomSuffix: true });
        const fetched = await fetch(blob.url, { cache: "no-store" }).then((r) => r.text());
        await del(blob.url);
        result.blob = fetched === "ok" ? "ok" : `unexpected: ${fetched}`;
      } catch (e) {
        result.blob = String(e);
        result.ok = false;
      }
    }
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
