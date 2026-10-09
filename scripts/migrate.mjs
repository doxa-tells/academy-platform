// Runs database migrations and the first-time seed.
// Called automatically before `next build` (see package.json) and locally via `npm run db:migrate`.
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL is not set — skipping migrations");
  process.exit(0);
}

let db;
let migrate;
let closeDb = async () => {};

if (url.startsWith("pglite:")) {
  const dir = url.slice("pglite:".length);
  mkdirSync(dir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  ({ migrate } = await import("drizzle-orm/pglite/migrator"));
  const client = new PGlite(dir);
  db = drizzle(client);
  closeDb = () => client.close();
} else {
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  ({ migrate } = await import("drizzle-orm/neon-http/migrator"));
  db = drizzle(neon(url));
}

const { sql } = await import("drizzle-orm");

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("[migrate] migrations applied");

const rows = async (q) => (await db.execute(q)).rows;
const code = () => randomBytes(9).toString("base64url");

// ---- first-time seed: users ----
// Runs until it succeeds once (marker in settings), so a deploy made before
// SEED_USERS was added doesn't block it. Afterwards it never touches accounts again.
// Source: scripts/seed-users.json (only bcrypt hashes, safe to commit) or the SEED_USERS env var.
const [seedDone] = await rows(sql`select value from settings where key = 'seed_users_done'`);
const seedFile = new URL("./seed-users.json", import.meta.url);
const useFile = existsSync(seedFile) && process.env.SEED_IGNORE_FILE !== "1";
const rawSeed = useFile ? readFileSync(seedFile, "utf8").trim() : (process.env.SEED_USERS || "").trim();
if (seedDone) {
  console.log("[seed] users already seeded earlier — skipping");
} else if (!rawSeed) {
  console.log("[seed] no seed-users.json and SEED_USERS is not set — no accounts created");
} else {
  let list = null;
  try {
    let parsed = JSON.parse(rawSeed);
    if (typeof parsed === "string") parsed = JSON.parse(parsed); // value pasted with extra quotes
    list = Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    console.log(`[seed] seed list is not valid JSON (${e.message}) — no accounts created`);
  }
  if (list) {
    let created = 0;
    for (const u of list) {
      if (!u?.login || !u?.name || !(u?.password || u?.passwordHash)) continue;
      const login = String(u.login).trim().toLowerCase();
      const [exists] = await rows(sql`select id from users where login = ${login}`);
      if (exists) continue;
      const hash = u.passwordHash ? String(u.passwordHash) : await bcrypt.hash(String(u.password), 10);
      const role = u.role === "admin" ? "admin" : "student";
      await db.execute(
        sql`insert into users (role, name, login, password_hash, telegram_link_code)
            values (${role}, ${String(u.name)}, ${login}, ${hash}, ${code()})`,
      );
      created++;
    }
    await db.execute(sql`insert into settings (key, value) values ('seed_users_done', ${new Date().toISOString()})
                         on conflict (key) do nothing`);
    console.log(`[seed] created ${created} users: ${list.map((u) => u?.login).join(", ")}`);
  }
}

// ---- first-time seed: starter course content ----
const [{ n: moduleCount }] = await rows(sql`select count(*)::int as n from modules`);
const [{ n: adminCount }] = await rows(sql`select count(*)::int as n from users where role = 'admin'`);
if (moduleCount === 0 && adminCount > 0 && process.env.SEED_DEMO !== "0") {
  const [mod] = await rows(sql`
    insert into modules (title, description, position)
    values ('Модуль 1. Старт', 'Знакомство с курсом и первое задание. Отредактируй этот модуль в админке → Курс.', 0)
    returning id`);
  const [l1] = await rows(sql`
    insert into lessons (module_id, title, description, video_url, position)
    values (${mod.id}, 'Как устроен курс',
      ${"Здесь будет видео-урок. Вставь ссылку на YouTube (доступ по ссылке), Vimeo, Loom или Google Drive в админке → Курс.\n\nПод видео можно писать конспект: **жирный текст**, списки, ссылки."},
      '', 0)
    returning id`);
  await rows(sql`
    insert into lessons (module_id, title, description, video_url, position)
    values (${mod.id}, 'Инструменты и настройка', 'Второй пример урока.', '', 1)`);
  await rows(sql`
    insert into assignments (module_id, lesson_id, title, description, due_at, position)
    values (${mod.id}, ${l1.id}, 'Первое задание: точка А',
      ${"Загрузи 1–3 фото или короткое видео своей текущей работы и напиши в комментарии, какой результат хочешь получить к концу курса."},
      now() + interval '7 days', 0)`);
  const [admin] = await rows(sql`select id from users where role = 'admin' order by created_at limit 1`);
  await rows(sql`
    insert into posts (author_id, kind, title, body, audience, pinned)
    values (${admin.id}, 'announcement', 'Добро пожаловать на курс!',
      ${"Здесь будут появляться заметки, промпты и важные объявления.\n\nНачни с раздела **Уроки**, а первое задание загрузи в **Домашки**. Подключи Telegram в профиле, чтобы не пропускать новости."},
      'all', true)`);
  await rows(sql`
    insert into posts (author_id, kind, title, body, audience, pinned)
    values (${admin.id}, 'prompt', 'Пример промпта',
      ${"Ты — опытный наставник. Посмотри на мою работу и дай три конкретных совета, что улучшить в первую очередь. Объясняй простыми словами."},
      'all', false)`);
  console.log("[seed] starter course content created");
}

// ---- Telegram webhook (production deploys only; never fails the build) ----
const tgToken = process.env.TELEGRAM_BOT_TOKEN;
const prodUrl =
  process.env.APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
if (tgToken && prodUrl.startsWith("https://") && process.env.VERCEL_ENV === "production") {
  try {
    const api = (method, body) =>
      fetch(`https://api.telegram.org/bot${tgToken}/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json());
    const me = await api("getMe", {});
    if (me.ok) {
      const [existing] = await rows(sql`select value from settings where key = 'telegram_webhook_secret'`);
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET || existing?.value || randomBytes(24).toString("hex");
      const upsert = (key, value) =>
        db.execute(sql`insert into settings (key, value) values (${key}, ${value})
                       on conflict (key) do update set value = excluded.value, updated_at = now()`);
      await upsert("telegram_webhook_secret", secret);
      await upsert("telegram_bot_username", me.result.username);
      const hook = await api("setWebhook", {
        url: `${prodUrl.replace(/\/$/, "")}/api/telegram/webhook`,
        secret_token: secret,
        allowed_updates: ["message"],
      });
      await api("setMyCommands", { commands: [{ command: "start", description: "Подключить уведомления" }] });
      console.log(`[telegram] @${me.result.username} webhook: ${hook.ok ? "ok" : hook.description}`);
    } else {
      console.log("[telegram] getMe failed:", me.description);
    }
  } catch (e) {
    console.log("[telegram] setup skipped:", e.message);
  }
}

await closeDb();
console.log("[migrate] done");
