import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "./db";
import { getStudentReports } from "./course";
import { dueFor, getCohortOverrides } from "./cohorts";
import { getReviewQueue } from "./review-queue";
import { escapeHtml, sendTelegram } from "./telegram";
import { formatDateTime } from "./format";

async function remindOnce(kind: string, refId: string, userId: string) {
  const inserted = await db
    .insert(schema.reminders)
    .values({ kind, refId, userId })
    .onConflictDoNothing()
    .returning({ id: schema.reminders.id });
  return inserted.length > 0;
}

/** Runs once a day (Vercel Cron): deadline reminders for students + digest for the teacher. */
export async function runDaily(now = new Date()) {
  const summary = { dueSoon: 0, overdue: 0, digests: 0 };
  const students = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.role, "student"), eq(schema.users.active, true)));
  const subs = await db.select().from(schema.submissions);
  const statusOf = (aid: string, sid: string) => subs.find((s) => s.assignmentId === aid && s.studentId === sid)?.status;
  const needsAction = (aid: string, sid: string) => {
    const st = statusOf(aid, sid);
    return !st || st === "revision";
  };

  // Сроки у каждого потока свои: считаем их для каждого студента отдельно.
  const [assignments, ov] = await Promise.all([db.select().from(schema.assignments), getCohortOverrides()]);
  const soonUntil = now.getTime() + 30 * 3600 * 1000; // "завтра" ≈ ближайшие 30 часов
  const lateSince = now.getTime() - 3 * 86400 * 1000; // просрочено не больше 3 дней назад
  for (const s of students) {
    if (!s.telegramChatId) continue;
    for (const a of assignments) {
      const due = dueFor(a, s.cohort, ov);
      if (!due || !needsAction(a.id, s.id)) continue;
      const t = due.getTime();
      if (t > now.getTime() && t <= soonUntil) {
        if (!(await remindOnce("due_soon", a.id, s.id))) continue;
        await sendTelegram(
          s.telegramChatId,
          `⏰ <b>Скоро дедлайн</b>\n${escapeHtml(a.title)}\nСрок: ${formatDateTime(due)}`,
          { path: `/homework/${a.id}`, label: "Сдать работу" },
        );
        summary.dueSoon++;
      } else if (t <= now.getTime() && t > lateSince) {
        if (!(await remindOnce("overdue", a.id, s.id))) continue;
        await sendTelegram(
          s.telegramChatId,
          `📌 <b>Срок задания прошёл</b>\n${escapeHtml(a.title)}\nНичего страшного — загрузи, что успел, и получи разбор.`,
          { path: `/homework/${a.id}`, label: "Открыть задание" },
        );
        summary.overdue++;
      }
    }
  }

  // Digest for admins
  const admins = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.role, "admin"), eq(schema.users.active, true), isNotNull(schema.users.telegramChatId)));
  if (admins.length) {
    const [queue, reports] = await Promise.all([getReviewQueue(["submitted", "in_review"]), getStudentReports(now)]);
    const risky = reports.filter((r) => r.risk !== "ok");
    if (queue.length || risky.length) {
      const lines = [`☀️ <b>Сводка на сегодня</b>`];
      lines.push(queue.length ? `📥 Ждут проверки: <b>${queue.length}</b>` : "📥 Новых работ нет");
      for (const r of risky) {
        lines.push(`${r.risk === "high" ? "🔴" : "🟡"} ${escapeHtml(r.student.name)}: ${escapeHtml(r.reasons.join(", "))}`);
      }
      for (const a of admins) {
        await sendTelegram(a.telegramChatId!, lines.join("\n"), { path: "/admin", label: "Открыть сводку" });
        summary.digests++;
      }
    }
  }
  return summary;
}
