"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq, gt, lt, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { generateLinkCode, generatePassword, hashPassword, requireAdmin } from "@/lib/auth";
import { parseAttachments, isAllowedUploadUrl } from "@/lib/uploads-server";
import { activeStudentIds, notifyUser, notifyUsers } from "@/lib/notify";
import { escapeHtml, setupBot, sendTelegram } from "@/lib/telegram";
import { deleteSetting, setSetting } from "@/lib/settings";
import { formatDateTime, parseLocalDateTime } from "@/lib/format";
import type { AnnotationData, SubmissionStatus } from "@/lib/db/schema";

export type ActionState = { ok?: boolean; error?: string; message?: string; password?: string; login?: string } | null;

const str = (form: FormData, key: string, max = 10000) => String(form.get(key) ?? "").trim().slice(0, max);
const bool = (form: FormData, key: string) => form.get(key) === "on" || form.get(key) === "true";

function refresh() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

function normalizeLogin(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 40);
}

export async function createStudent(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(form, "name", 100);
  const login = normalizeLogin(str(form, "login", 60));
  if (!name) return { error: "Укажи имя студента." };
  if (login.length < 3) return { error: "Логин — минимум 3 символа: латиница, цифры, точка или дефис." };
  const exists = await db.query.users.findFirst({ where: eq(schema.users.login, login) });
  if (exists) return { error: `Логин «${login}» уже занят.` };
  const password = generatePassword();
  await db.insert(schema.users).values({
    role: "student",
    name,
    login,
    passwordHash: await hashPassword(password),
    telegramLinkCode: generateLinkCode(),
  });
  refresh();
  return { ok: true, login, password, message: `Студент ${name} добавлен.` };
}

export async function resetPassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(form, "userId", 100);
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
  if (!user) return { error: "Пользователь не найден." };
  const password = generatePassword();
  await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(password), sessionVersion: user.sessionVersion + 1, failedLogins: 0, lockedUntil: null })
    .where(eq(schema.users.id, id));
  refresh();
  return { ok: true, login: user.login, password, message: `Новый пароль для ${user.name}.` };
}

export async function updateStudent(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(form, "userId", 100);
  const name = str(form, "name", 100);
  const login = normalizeLogin(str(form, "login", 60));
  if (!name || login.length < 3) return { error: "Проверь имя и логин." };
  const clash = await db.query.users.findFirst({ where: eq(schema.users.login, login) });
  if (clash && clash.id !== id) return { error: `Логин «${login}» уже занят.` };
  await db.update(schema.users).set({ name, login }).where(eq(schema.users.id, id));
  refresh();
  return { ok: true, message: "Сохранено." };
}

export async function setStudentActive(userId: string, active: boolean) {
  await requireAdmin();
  await db
    .update(schema.users)
    .set({ active, sessionVersion: sql`${schema.users.sessionVersion} + 1` })
    .where(and(eq(schema.users.id, userId), eq(schema.users.role, "student")));
  refresh();
}

// ---------------------------------------------------------------------------
// Course structure
// ---------------------------------------------------------------------------

async function nextPosition(table: typeof schema.modules | typeof schema.lessons | typeof schema.assignments, moduleId?: string) {
  const where =
    moduleId && "moduleId" in table ? eq((table as typeof schema.lessons).moduleId, moduleId) : undefined;
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${table.position}), -1)::int` })
    .from(table)
    .where(where);
  return (row?.max ?? -1) + 1;
}

export async function createModule(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const title = str(form, "title", 200);
  if (!title) return { error: "Назови модуль." };
  await db.insert(schema.modules).values({ title, description: str(form, "description", 2000), position: await nextPosition(schema.modules) });
  refresh();
  return { ok: true, message: "Модуль добавлен." };
}

export async function updateModule(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(form, "id", 100);
  const title = str(form, "title", 200);
  if (!title) return { error: "Назови модуль." };
  await db.update(schema.modules).set({ title, description: str(form, "description", 2000) }).where(eq(schema.modules.id, id));
  refresh();
  return { ok: true, message: "Сохранено." };
}

export async function deleteModule(id: string) {
  await requireAdmin();
  await db.delete(schema.modules).where(eq(schema.modules.id, id));
  refresh();
  redirect("/admin/course");
}

type Movable = "module" | "lesson" | "assignment";

export async function move(kind: Movable, id: string, dir: "up" | "down") {
  await requireAdmin();
  const table = kind === "module" ? schema.modules : kind === "lesson" ? schema.lessons : schema.assignments;
  const current = (await db.select().from(table).where(eq(table.id, id)))[0] as
    | { id: string; position: number; moduleId?: string }
    | undefined;
  if (!current) return;
  const scope = kind === "module" ? undefined : eq((table as typeof schema.lessons).moduleId, current.moduleId!);
  const neighbor = (
    await db
      .select()
      .from(table)
      .where(and(scope, dir === "up" ? lt(table.position, current.position) : gt(table.position, current.position)))
      .orderBy(dir === "up" ? desc(table.position) : asc(table.position))
      .limit(1)
  )[0] as { id: string; position: number } | undefined;
  if (!neighbor) return;
  await db.update(table).set({ position: neighbor.position }).where(eq(table.id, current.id));
  await db.update(table).set({ position: current.position }).where(eq(table.id, neighbor.id));
  refresh();
}

export async function setSurveyOpen(moduleId: string, open: boolean) {
  await requireAdmin();
  const [mod] = await db.update(schema.modules).set({ surveyOpen: open }).where(eq(schema.modules.id, moduleId)).returning();
  if (open && mod) {
    after(async () =>
      notifyUsers(
        await activeStudentIds(),
        `📊 <b>Оцени модуль «${escapeHtml(mod.title)}»</b>\nДве минуты: оценка от 1 до 10 и что улучшить.`,
        { path: `/survey/${mod.id}`, label: "Ответить" },
      ),
    );
  }
  refresh();
}

export async function createLesson(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const moduleId = str(form, "moduleId", 100);
  const title = str(form, "title", 200);
  if (!title) return { error: "Назови урок." };
  const [lesson] = await db
    .insert(schema.lessons)
    .values({
      moduleId,
      title,
      videoUrl: str(form, "videoUrl", 1000),
      description: str(form, "description", 20000),
      position: await nextPosition(schema.lessons, moduleId),
    })
    .returning();
  if (bool(form, "notify")) {
    after(async () =>
      notifyUsers(await activeStudentIds(), `🎬 <b>Новый урок</b>\n${escapeHtml(lesson.title)}`, {
        path: `/lessons/${lesson.id}`,
        label: "Смотреть",
      }),
    );
  }
  refresh();
  return { ok: true, message: "Урок добавлен." };
}

export async function updateLesson(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(form, "id", 100);
  const title = str(form, "title", 200);
  if (!title) return { error: "Назови урок." };
  await db
    .update(schema.lessons)
    .set({ title, videoUrl: str(form, "videoUrl", 1000), description: str(form, "description", 20000) })
    .where(eq(schema.lessons.id, id));
  refresh();
  return { ok: true, message: "Урок сохранён." };
}

export async function deleteLesson(id: string) {
  await requireAdmin();
  await db.delete(schema.lessons).where(eq(schema.lessons.id, id));
  refresh();
  redirect("/admin/course");
}

export async function createAssignment(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const moduleId = str(form, "moduleId", 100);
  const title = str(form, "title", 200);
  if (!title) return { error: "Назови задание." };
  const lessonId = str(form, "lessonId", 100) || null;
  const dueAt = parseLocalDateTime(str(form, "dueAt", 30));
  const [a] = await db
    .insert(schema.assignments)
    .values({
      moduleId,
      lessonId,
      title,
      description: str(form, "description", 20000),
      dueAt,
      position: await nextPosition(schema.assignments, moduleId),
    })
    .returning();
  if (bool(form, "notify")) {
    after(async () =>
      notifyUsers(
        await activeStudentIds(),
        `📝 <b>Новое задание</b>\n${escapeHtml(a.title)}${a.dueAt ? `\nСрок: ${formatDateTime(a.dueAt)}` : ""}`,
        { path: `/homework/${a.id}`, label: "Открыть задание" },
      ),
    );
  }
  refresh();
  return { ok: true, message: "Задание добавлено." };
}

export async function updateAssignment(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(form, "id", 100);
  const title = str(form, "title", 200);
  if (!title) return { error: "Назови задание." };
  await db
    .update(schema.assignments)
    .set({
      title,
      description: str(form, "description", 20000),
      lessonId: str(form, "lessonId", 100) || null,
      dueAt: parseLocalDateTime(str(form, "dueAt", 30)),
    })
    .where(eq(schema.assignments.id, id));
  // A new deadline deserves a new reminder
  await db.delete(schema.reminders).where(and(eq(schema.reminders.refId, id), eq(schema.reminders.kind, "due_soon")));
  refresh();
  return { ok: true, message: "Задание сохранено." };
}

export async function deleteAssignment(id: string) {
  await requireAdmin();
  await db.delete(schema.assignments).where(eq(schema.assignments.id, id));
  refresh();
  redirect("/admin/course");
}

// ---------------------------------------------------------------------------
// Board posts
// ---------------------------------------------------------------------------

export async function createPost(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const kind = z.enum(["note", "prompt", "link", "announcement"]).catch("note").parse(form.get("kind"));
  const title = str(form, "title", 300);
  const body = str(form, "body", 30000);
  let url = str(form, "url", 2000);
  const audience = form.get("audience") === "selected" ? "selected" : "all";
  const targets = form.getAll("targets").map(String).filter(Boolean);
  if (!title) return { error: "Добавь заголовок поста." };
  if (kind === "prompt" && !body) return { error: "Вставь текст промпта." };
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  if (audience === "selected" && targets.length === 0) return { error: "Выбери, кому отправить пост." };

  const [post] = await db
    .insert(schema.posts)
    .values({ authorId: admin.id, kind, title, body, url, audience, pinned: bool(form, "pinned") })
    .returning();
  if (audience === "selected") {
    await db.insert(schema.postTargets).values(targets.map((userId) => ({ postId: post.id, userId })));
  }
  if (bool(form, "notify")) {
    const recipients = audience === "all" ? await activeStudentIds() : targets;
    const icon = kind === "prompt" ? "✨" : kind === "announcement" ? "📣" : "📌";
    after(() =>
      notifyUsers(recipients, `${icon} <b>Новое на доске</b>\n${escapeHtml(post.title)}`, {
        path: `/board#post-${post.id}`,
        label: "Открыть доску",
      }),
    );
  }
  refresh();
  return { ok: true, message: "Пост опубликован." };
}

export async function deletePost(id: string) {
  await requireAdmin();
  await db.delete(schema.posts).where(eq(schema.posts.id, id));
  refresh();
}

export async function togglePin(id: string, pinned: boolean) {
  await requireAdmin();
  await db.update(schema.posts).set({ pinned }).where(eq(schema.posts.id, id));
  refresh();
}

// ---------------------------------------------------------------------------
// Homework review
// ---------------------------------------------------------------------------

const annotationSchema = z.array(
  z.object({
    url: z.string().max(2000),
    name: z.string().max(300).default(""),
    annotation: z.object({
      strokes: z
        .array(
          z.object({
            color: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
            width: z.number().min(1).max(20),
            points: z.array(z.tuple([z.number().min(0).max(1000), z.number().min(0).max(1000)])).max(5000),
          }),
        )
        .max(300),
      pins: z
        .array(z.object({ x: z.number().min(0).max(1000), y: z.number().min(0).max(1000), n: z.number().int(), color: z.string().max(20) }))
        .max(50),
    }),
  }),
);

export async function sendFeedback(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const submissionId = str(form, "submissionId", 100);
  const text = str(form, "text", 10000);
  const decision = z.enum(["comment", "revision", "accepted"]).catch("comment").parse(form.get("decision"));
  const files = parseAttachments(form.get("attachments"));
  let annotations: z.infer<typeof annotationSchema> = [];
  try {
    const raw = form.get("annotations");
    if (typeof raw === "string" && raw) annotations = annotationSchema.parse(JSON.parse(raw)).filter((a) => isAllowedUploadUrl(a.url));
  } catch {
    return { error: "Не удалось сохранить пометки на фото. Попробуй ещё раз." };
  }

  if (!text && files.length === 0 && annotations.length === 0 && decision === "comment") {
    return { error: "Напиши комментарий, запиши голосовое или выбери решение." };
  }

  const submission = await db.query.submissions.findFirst({ where: eq(schema.submissions.id, submissionId) });
  if (!submission) return { error: "Работа не найдена." };
  const assignment = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, submission.assignmentId) });

  const newStatus: SubmissionStatus | null = decision === "comment" ? null : decision;
  const [entry] = await db
    .insert(schema.entries)
    .values({ submissionId, authorId: admin.id, kind: "feedback", text, statusChange: newStatus })
    .returning({ id: schema.entries.id });
  const rows = [
    ...files.map((f) => ({ ...f, entryId: entry.id, annotation: null as AnnotationData | null })),
    ...annotations.map((a) => ({
      entryId: entry.id,
      kind: "annotation" as const,
      url: a.url,
      name: a.name,
      contentType: "image/annotated",
      size: 0,
      annotation: a.annotation,
    })),
  ];
  if (rows.length) await db.insert(schema.attachments).values(rows);
  await db
    .update(schema.submissions)
    .set({ status: newStatus ?? (submission.status === "submitted" ? "in_review" : submission.status), updatedAt: new Date() })
    .where(eq(schema.submissions.id, submissionId));

  const title = assignment ? escapeHtml(assignment.title) : "домашка";
  const head =
    decision === "accepted"
      ? `✅ <b>Работа принята</b>\n${title}`
      : decision === "revision"
        ? `✏️ <b>Нужна доработка</b>\n${title}`
        : `💬 <b>Новый комментарий к работе</b>\n${title}`;
  const extras = [files.some((f) => f.kind === "audio") ? "🎙 голосовой разбор" : "", files.some((f) => f.kind === "video") ? "🎥 видео-разбор" : "", annotations.length ? "🖍 пометки на фото" : ""]
    .filter(Boolean)
    .join(", ");
  after(() =>
    notifyUser(
      submission.studentId,
      `${head}${extras ? `\n${extras}` : ""}${text ? `\n\n«${escapeHtml(text.slice(0, 400))}${text.length > 400 ? "…" : ""}»` : ""}`,
      { path: `/homework/${submission.assignmentId}`, label: "Посмотреть разбор" },
    ),
  );
  refresh();
  return { ok: true, message: decision === "accepted" ? "Работа принята." : decision === "revision" ? "Отправлено на доработку." : "Комментарий отправлен." };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function saveBotToken(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const token = str(form, "token", 200);
  if (!/^\d{5,}:[A-Za-z0-9_-]{20,}$/.test(token)) return { error: "Токен выглядит неверно. Он похож на 123456789:AAF…" };
  const res = await setupBot(token);
  if (!res.ok) return { error: res.error };
  await setSetting("telegram_bot_token", token);
  refresh();
  return {
    ok: true,
    message: res.webhookOk
      ? `Бот @${res.username} подключён.`
      : `Бот @${res.username} сохранён, но вебхук не установлен: ${res.webhookError ?? "неизвестная ошибка"}`,
  };
}

export async function reconnectBot(_prev: ActionState): Promise<ActionState> {
  await requireAdmin();
  const { getBotToken } = await import("@/lib/telegram");
  const token = await getBotToken();
  if (!token) return { error: "Сначала вставь токен бота." };
  const res = await setupBot(token);
  if (!res.ok) return { error: res.error };
  refresh();
  return res.webhookOk ? { ok: true, message: `Вебхук для @${res.username} обновлён.` } : { error: res.webhookError ?? "Вебхук не установлен" };
}

export async function removeBot() {
  await requireAdmin();
  await deleteSetting("telegram_bot_token");
  await deleteSetting("telegram_bot_username");
  refresh();
}

export async function sendTestMessage(_prev: ActionState): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin.telegramChatId) return { error: "Сначала подключи свой Telegram кнопкой выше." };
  const ok = await sendTelegram(admin.telegramChatId, "👋 <b>Тестовое сообщение</b>\nУведомления платформы работают.", {
    path: "/admin",
    label: "Открыть админку",
  });
  return ok ? { ok: true, message: "Отправлено — проверь Telegram." } : { error: "Telegram не принял сообщение. Проверь токен бота." };
}
