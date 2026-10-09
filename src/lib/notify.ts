import "server-only";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db, schema } from "./db";
import { sendTelegram } from "./telegram";

type Link = { path: string; label: string };

export async function notifyUsers(userIds: string[], html: string, link?: Link) {
  if (userIds.length === 0) return;
  const rows = await db
    .select({ chatId: schema.users.telegramChatId })
    .from(schema.users)
    .where(and(inArray(schema.users.id, userIds), isNotNull(schema.users.telegramChatId), eq(schema.users.active, true)));
  await Promise.all(rows.map((r) => (r.chatId ? sendTelegram(r.chatId, html, link) : null)));
}

export async function notifyUser(userId: string, html: string, link?: Link) {
  return notifyUsers([userId], html, link);
}

export async function notifyAdmins(html: string, link?: Link) {
  const admins = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.role, "admin"), eq(schema.users.active, true)));
  return notifyUsers(
    admins.map((a) => a.id),
    html,
    link,
  );
}

export async function activeStudentIds() {
  const rows = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.role, "student"), eq(schema.users.active, true)));
  return rows.map((r) => r.id);
}
