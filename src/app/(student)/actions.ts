"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireStudent } from "@/lib/auth";
import { parseAttachments } from "@/lib/uploads-server";
import { notifyAdmins } from "@/lib/notify";
import { escapeHtml } from "@/lib/telegram";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

export async function toggleLessonComplete(lessonId: string, done: boolean) {
  const user = await requireStudent();
  if (done) {
    await db.insert(schema.lessonCompletions).values({ userId: user.id, lessonId }).onConflictDoNothing();
  } else {
    await db
      .delete(schema.lessonCompletions)
      .where(and(eq(schema.lessonCompletions.userId, user.id), eq(schema.lessonCompletions.lessonId, lessonId)));
  }
  revalidatePath("/", "layout");
}

export async function submitAttempt(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireStudent();
  const assignmentId = String(form.get("assignmentId") || "");
  const text = String(form.get("text") || "").trim().slice(0, 5000);
  const files = parseAttachments(form.get("attachments"));

  if (!text && files.length === 0) return { error: "Добавь фото, видео или комментарий." };

  const assignment = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, assignmentId) });
  if (!assignment) return { error: "Задание не найдено." };

  const existing = await db.query.submissions.findFirst({
    where: and(eq(schema.submissions.assignmentId, assignmentId), eq(schema.submissions.studentId, user.id)),
  });
  if (existing?.status === "accepted") return { error: "Работа уже принята — новые попытки не нужны." };

  const now = new Date();
  let submissionId: string;
  const isResubmit = existing?.status === "revision";
  if (existing) {
    submissionId = existing.id;
    await db
      .update(schema.submissions)
      .set({ status: existing.status === "in_review" ? "in_review" : "submitted", updatedAt: now, lastAttemptAt: now })
      .where(eq(schema.submissions.id, existing.id));
  } else {
    const [created] = await db
      .insert(schema.submissions)
      .values({ assignmentId, studentId: user.id, status: "submitted" })
      .onConflictDoNothing()
      .returning({ id: schema.submissions.id });
    if (!created) return { error: "Не удалось сохранить, обнови страницу." };
    submissionId = created.id;
  }

  const [entry] = await db
    .insert(schema.entries)
    .values({ submissionId, authorId: user.id, kind: "attempt", text, statusChange: "submitted" })
    .returning({ id: schema.entries.id });
  if (files.length > 0) {
    await db.insert(schema.attachments).values(files.map((f) => ({ ...f, entryId: entry.id })));
  }

  after(() =>
    notifyAdmins(
      `${isResubmit ? "🔁 <b>Доработка</b>" : "📥 <b>Новая домашка</b>"}\n${escapeHtml(user.name)} — ${escapeHtml(assignment.title)}` +
        (files.length ? `\nФайлов: ${files.length}` : "") +
        (text ? `\n\n«${escapeHtml(text.slice(0, 300))}${text.length > 300 ? "…" : ""}»` : ""),
      { path: `/admin/reviews/${submissionId}`, label: "Открыть работу" },
    ),
  );

  revalidatePath("/", "layout");
  return { ok: true, message: "Работа отправлена. Пришлю уведомление, когда будет разбор." };
}

export async function submitSurvey(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireStudent();
  const moduleId = String(form.get("moduleId") || "");
  const score = Number(form.get("score"));
  const improve = String(form.get("improve") || "").trim().slice(0, 3000);
  if (!Number.isInteger(score) || score < 1 || score > 10) return { error: "Выбери оценку от 1 до 10." };
  const mod = await db.query.modules.findFirst({ where: eq(schema.modules.id, moduleId) });
  if (!mod) return { error: "Модуль не найден." };

  await db
    .insert(schema.surveyResponses)
    .values({ moduleId, studentId: user.id, score, improve })
    .onConflictDoUpdate({
      target: [schema.surveyResponses.moduleId, schema.surveyResponses.studentId],
      set: { score, improve, createdAt: sql`now()` },
    });

  after(() =>
    notifyAdmins(
      `${score <= 6 ? "⚠️" : "📊"} <b>Оценка модуля: ${score}/10</b>\n${escapeHtml(user.name)} — ${escapeHtml(mod.title)}` +
        (improve ? `\n\nЧто улучшить: «${escapeHtml(improve.slice(0, 500))}»` : ""),
      { path: "/admin/surveys", label: "Все ответы" },
    ),
  );
  revalidatePath("/", "layout");
  return { ok: true, message: "Спасибо! Ответ отправлен преподавателю." };
}

export async function markPostsRead(postIds: string[]) {
  const user = await requireStudent();
  if (postIds.length === 0) return;
  await db
    .insert(schema.postReads)
    .values(postIds.slice(0, 200).map((postId) => ({ postId, userId: user.id })))
    .onConflictDoNothing();
}
