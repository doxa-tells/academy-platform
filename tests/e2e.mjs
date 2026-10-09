// End-to-end check of every feature against a local production build.
// Usage: npm run build && node tests/e2e.mjs
// Spins up: a fake Telegram API (records messages), `next start` with a fresh PGlite DB, headless Chromium.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import path from "node:path";
import { chromium } from "playwright-core";

const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const TG_PORT = 4010;
const WEBHOOK_SECRET = "test-webhook-secret";
const CRON_SECRET = "test-cron-secret";
const ART = path.resolve("tests/artifacts");
const DB_DIR = path.resolve(".data/e2e-pglite");
rmSync(ART, { recursive: true, force: true });
mkdirSync(ART, { recursive: true });

const USERS = {
  admin: { login: "admin", password: "admin-pass-123", name: "Дархан" },
  s1: { login: "aigerim", password: "student-pass-1", name: "Айгерим Садыкова" },
  s2: { login: "timur", password: "student-pass-2", name: "Тимур Ахметов" },
  s3: { login: "madina", password: "student-pass-3", name: "Мадина Ким" },
};

// ---------------------------------------------------------------- fake Telegram
const tgMessages = [];
const tg = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const method = req.url.split("/").pop();
    const payload = body ? JSON.parse(body) : {};
    res.setHeader("content-type", "application/json");
    if (method === "getMe") return res.end(JSON.stringify({ ok: true, result: { username: "test_academy_bot", first_name: "Test" } }));
    if (method === "sendMessage") {
      tgMessages.push(payload);
      return res.end(JSON.stringify({ ok: true, result: { message_id: tgMessages.length } }));
    }
    res.end(JSON.stringify({ ok: true, result: true }));
  });
});
await new Promise((r) => tg.listen(TG_PORT, r));
const messagesTo = (chatId) => tgMessages.filter((m) => String(m.chat_id) === String(chatId));

// ---------------------------------------------------------------- server
const env = {
  ...process.env,
  DATABASE_URL: `pglite:${DB_DIR}`,
  SESSION_SECRET: "e2e-session-secret-0123456789",
  CRON_SECRET,
  TELEGRAM_API_BASE: `http://127.0.0.1:${TG_PORT}`,
  TELEGRAM_WEBHOOK_SECRET: WEBHOOK_SECRET,
  APP_URL: BASE,
  PORT: String(PORT),
  SEED_USERS: JSON.stringify(Object.values(USERS).map((u, i) => ({ ...u, role: i === 0 ? "admin" : "student" }))),
};
rmSync(DB_DIR, { recursive: true, force: true });
await new Promise((resolve, reject) => {
  const m = spawn("node", ["scripts/migrate.mjs"], { env, stdio: "inherit" });
  m.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("migrate failed"))));
});
const server = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], { env, stdio: ["ignore", "pipe", "pipe"], detached: true });
const stopServer = () => {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
};
process.on("exit", stopServer);
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(`${BASE}/api/health`);
    if (r.ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

// ---------------------------------------------------------------- harness
const results = [];
async function step(name, fn) {
  const t = Date.now();
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name} (${Date.now() - t}ms)`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`  ✗ ${name}\n      ${e.message.split("\n").slice(0, 4).join("\n      ")}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ---------------------------------------------------------------- test files
function crc32(buf) {
  let c,
    crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function png(w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = (x * 255) / w;
      raw[o + 1] = (y * 255) / h;
      raw[o + 2] = 160;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const photo = png(900, 600);
const fakeVideo = Buffer.concat([Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70]), Buffer.alloc(20000, 1)]);

// ---------------------------------------------------------------- browser
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});
async function newSession(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport, locale: "ru-RU", timezoneId: "Asia/Almaty" });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write", "microphone", "camera"], { origin: BASE });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("    [pageerror]", e.message));
  return { ctx, page };
}
async function login(page, user) {
  await page.goto(`${BASE}/login`);
  await page.fill("#login", user.login);
  await page.fill("#password", user.password);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.click("button[type=submit]")]);
}
const shot = (page, name) => page.screenshot({ path: `${ART}/${name}.png`, fullPage: true });

console.log("\nE2E: academy platform\n");

const admin = await newSession();
const s1 = await newSession({ width: 390, height: 844 }); // phone

let studentCode = "";
let submissionUrl = "";
let newAssignmentTitle = "Задание 2: свет";

await step("Неавторизованный пользователь попадает на вход", async () => {
  const { page } = await newSession();
  await page.goto(`${BASE}/homework`);
  assert(page.url().includes("/login"), `ожидался /login, получили ${page.url()}`);
  await page.close();
});

await step("Неверный пароль показывает ошибку", async () => {
  const { page } = await newSession();
  await page.goto(`${BASE}/login`);
  await page.fill("#login", "admin");
  await page.fill("#password", "wrong");
  await page.click("button[type=submit]");
  await page.waitForSelector("text=Неверный логин или пароль");
  await shot(page, "01-login-error");
  await page.close();
});

await step("Админ входит и видит сводку «кто отстаёт» по 3 студентам", async () => {
  await login(admin.page, USERS.admin);
  assert(admin.page.url().endsWith("/admin"), "админ не попал в /admin");
  const cards = await admin.page.locator('[data-testid="risk-list"] > div').count();
  assert(cards === 3, `ожидалось 3 карточки студентов, найдено ${cards}`);
  await admin.page.waitForSelector("text=ещё ни разу не заходил");
  await shot(admin.page, "02-admin-dashboard-initial");
});

await step("Подключение Telegram-бота в настройках", async () => {
  await admin.page.goto(`${BASE}/admin/settings`);
  await admin.page.fill("#token", "123456789:AAFakeTokenForLocalTesting_abcdefgh");
  await admin.page.click("text=Подключить бота");
  await admin.page.waitForSelector("text=@test_academy_bot");
  const link = await admin.page.getAttribute('[data-testid="telegram-link"]', "href");
  assert(link?.startsWith("https://t.me/test_academy_bot?start="), "нет ссылки на бота для админа");
  const adminCode = link.split("start=")[1];
  const r = await fetch(`${BASE}/api/telegram/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": WEBHOOK_SECRET },
    body: JSON.stringify({ message: { text: `/start ${adminCode}`, chat: { id: 999, type: "private" }, from: { username: "teacher" } } }),
  });
  assert(r.ok, "webhook вернул ошибку");
  assert(messagesTo(999).some((m) => m.text.includes("Готово")), "бот не ответил админу");
  await admin.page.reload();
  await admin.page.waitForSelector("text=Подключено к @teacher");
  await admin.page.click("text=Отправить себе тест");
  await admin.page.waitForSelector("text=Отправлено — проверь Telegram");
  assert(messagesTo(999).some((m) => m.text.includes("Тестовое сообщение")), "тестовое сообщение не дошло");
  await shot(admin.page, "03-admin-settings");
});

await step("Webhook отклоняет запросы без секрета", async () => {
  const r = await fetch(`${BASE}/api/telegram/webhook`, { method: "POST", body: "{}" });
  assert(r.status === 401, `ожидался 401, получили ${r.status}`);
});

await step("Студент входит с телефона и подключает Telegram", async () => {
  await login(s1.page, USERS.s1);
  assert(new URL(s1.page.url()).pathname === "/", "студент не на главной");
  await s1.page.waitForSelector("text=Привет, Айгерим");
  await shot(s1.page, "04-student-home-mobile");
  await s1.page.goto(`${BASE}/profile`);
  const link = await s1.page.getAttribute('[data-testid="telegram-link"]', "href");
  studentCode = link.split("start=")[1];
  await fetch(`${BASE}/api/telegram/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": WEBHOOK_SECRET },
    body: JSON.stringify({ message: { text: `/start ${studentCode}`, chat: { id: 111, type: "private" }, from: { username: "aigerim_tg" } } }),
  });
  assert(messagesTo(111).some((m) => m.text.includes("Готово, Айгерим")), "бот не подтвердил подключение студенту");
  await s1.page.reload();
  await s1.page.waitForSelector("text=Подключено к @aigerim_tg");
});

await step("Студент не может открыть админку", async () => {
  await s1.page.goto(`${BASE}/admin/students`);
  assert(new URL(s1.page.url()).pathname === "/", `ожидался редирект на /, получили ${s1.page.url()}`);
});

await step("Админ публикует промпт всем + личную заметку одному студенту", async () => {
  await admin.page.goto(`${BASE}/admin/board`);
  const before = messagesTo(111).length;
  await admin.page.selectOption("#kind", "prompt");
  await admin.page.fill("#title", "Промпт для разбора света");
  await admin.page.fill("#body", "Опиши свет на фото: откуда он падает и что подчёркивает.");
  await admin.page.click("text=Опубликовать");
  await admin.page.waitForSelector("text=Пост опубликован");
  assert(messagesTo(111).length > before, "студент не получил уведомление о посте");

  await admin.page.selectOption("#kind", "note");
  await admin.page.fill("#title", "Лично для Тимура");
  await admin.page.fill("#body", "Посмотри урок 2 ещё раз.");
  await admin.page.click("text=Выбранным");
  await admin.page.check(`input[name="targets"] >> nth=1`);
  await admin.page.click("text=Опубликовать");
  await admin.page.waitForSelector("text=Пост опубликован");
  await admin.page.waitForSelector("text=Лично: Прочитали 0 из 1");
});

await step("Админ добавляет задание с дедлайном завтра (уведомление студентам)", async () => {
  await admin.page.goto(`${BASE}/admin/course`);
  const before = messagesTo(111).length;
  await admin.page.click("text=+ Добавить задание");
  const form = admin.page.locator('[data-testid="new-assignment-form"]').first();
  await form.locator('input[name="title"]').fill(newAssignmentTitle);
  await form.locator('textarea[name="description"]').fill("Сними **одну** сцену при трёх видах освещения.");
  const due = new Date(Date.now() + 20 * 3600 * 1000 + 5 * 3600 * 1000); // +20h, shown in Almaty time
  await form.locator('input[name="dueAt"]').fill(due.toISOString().slice(0, 16));
  await form.locator("button[type=submit]").click();
  await admin.page.waitForSelector(`text=${newAssignmentTitle}`);
  await admin.page.waitForTimeout(500);
  assert(messagesTo(111).slice(before).some((m) => m.text.includes("Новое задание")), "нет уведомления о новом задании");
  await shot(admin.page, "05-admin-course");
});

await step("Доска студента: новые посты выделены, личный пост не виден чужим, промпт копируется", async () => {
  await s1.page.goto(`${BASE}/board`);
  await s1.page.waitForSelector("text=Промпт для разбора света");
  assert((await s1.page.locator("text=Лично для Тимура").count()) === 0, "чужой личный пост виден");
  const marks = await s1.page.locator("text=новое").count();
  assert(marks >= 2, `ожидались отметки «новое», найдено ${marks}`);
  await shot(s1.page, "06-student-board-mobile");
  await s1.page.locator('[data-testid="copy-button"]').first().click();
  await s1.page.waitForSelector("text=Скопировано");
  const clip = await s1.page.evaluate(() => navigator.clipboard.readText());
  assert(clip.includes("Опиши свет"), `в буфере не промпт: ${clip}`);
});

await step("Админ видит, кто прочитал пост", async () => {
  await admin.page.goto(`${BASE}/admin/board`);
  await admin.page.waitForSelector("text=Прочитали 1 из 3");
  await shot(admin.page, "07-admin-board-receipts");
});

await step("Студент смотрит урок и отмечает его пройденным — прогресс растёт", async () => {
  await s1.page.goto(`${BASE}/lessons`);
  await s1.page.click("text=Как устроен курс");
  await s1.page.waitForSelector("text=Отметить как пройденный");
  await s1.page.click("text=Отметить как пройденный");
  await s1.page.waitForSelector("text=Урок пройден");
  await s1.page.goto(`${BASE}/progress`);
  await s1.page.waitForSelector("text=Карта прогресса");
  const sub = await s1.page.locator("main").innerText();
  assert(/Пройдено 25%/.test(sub), `ожидалось 25% (1 из 4 шагов), текст: ${sub.slice(0, 200)}`);
  await shot(s1.page, "08-student-progress-mobile");
});

await step("Студент сдаёт домашку: фото + видео + комментарий", async () => {
  const before = messagesTo(999).length;
  await s1.page.goto(`${BASE}/homework`);
  await s1.page.click("text=Первое задание: точка А");
  await s1.page.setInputFiles('[data-testid="file-input"]', [
    { name: "photo.png", mimeType: "image/png", buffer: photo },
    { name: "clip.mp4", mimeType: "video/mp4", buffer: fakeVideo },
  ]);
  await s1.page.waitForFunction(() => !document.body.innerText.includes("Файлы загружаются"), null, { timeout: 15000 });
  await s1.page.fill('textarea[name="text"]', "Вот моя текущая работа. Хочу научиться ставить свет.");
  await s1.page.click("text=Отправить на проверку");
  await s1.page.waitForSelector("text=Работа отправлена");
  await s1.page.waitForSelector('[data-testid="thread"] img');
  assert((await s1.page.locator('[data-testid="thread"] video').count()) === 1, "видео не появилось в ленте");
  await s1.page.waitForTimeout(500);
  assert(messagesTo(999).slice(before).some((m) => m.text.includes("Новая домашка")), "админ не получил уведомление о домашке");
  await shot(s1.page, "09-student-homework-submitted-mobile");
});

await step("Админ открывает работу → статус «На проверке»", async () => {
  await admin.page.goto(`${BASE}/admin/reviews`);
  await Promise.all([admin.page.waitForURL(/\/admin\/reviews\/[0-9a-f-]{36}/), admin.page.click('[data-testid="review-list"] a >> nth=0')]);
  submissionUrl = admin.page.url();
  await admin.page.waitForSelector("text=На проверке");
  await s1.page.goto(`${BASE}/homework`);
  await s1.page.waitForSelector("text=На проверке");
});

await step("Разбор: пометки на фото, голосовое, решение «Доработать»", async () => {
  await admin.page.goto(submissionUrl);
  await admin.page.click('[data-testid="annotate-image"]');
  const surface = admin.page.locator('[data-testid="annotator-surface"]');
  await surface.waitFor();
  const box = await surface.boundingBox();
  await admin.page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
  await admin.page.mouse.down();
  for (let i = 1; i <= 10; i++) await admin.page.mouse.move(box.x + box.width * (0.2 + i * 0.04), box.y + box.height * (0.3 + i * 0.02));
  await admin.page.mouse.up();
  await admin.page.click("text=Метка с номером");
  await admin.page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.6);
  await shot(admin.page, "10-annotator");
  await admin.page.click("text=Сохранить пометки");
  await admin.page.waitForSelector("text=Изменить");

  await admin.page.click("text=Записать голосовое");
  await admin.page.waitForSelector("text=Идёт запись голоса");
  await admin.page.waitForTimeout(1800);
  await admin.page.click("button:has-text('Готово')");
  await admin.page.waitForSelector("text=Вложений: 1");
  await admin.page.waitForFunction(() => !document.body.innerText.includes("загружаются"), null, { timeout: 15000 });

  await admin.page.fill('[data-testid="feedback-form"] textarea[name="text"]', "Хорошее начало! Убери пересвет слева (метка 1).");
  await admin.page.click("text=На доработку");
  const before = messagesTo(111).length;
  await admin.page.click("text=Отправить разбор");
  await admin.page.waitForSelector("text=Отправлено на доработку");
  await admin.page.waitForTimeout(500);
  const msg = messagesTo(111).slice(before).find((m) => m.text.includes("Нужна доработка"));
  assert(msg, "студент не получил уведомление о доработке");
  assert(msg.text.includes("голосовой разбор") && msg.text.includes("пометки на фото"), `в уведомлении нет деталей: ${msg.text}`);
  await shot(admin.page, "11-admin-review-after-feedback");
});

await step("Студент видит разбор: пометки, голосовое, статус «Доработать»", async () => {
  await s1.page.goto(`${BASE}/homework`);
  await s1.page.click("text=Первое задание: точка А");
  await s1.page.waitForSelector("text=Разбор от преподавателя");
  await s1.page.waitForSelector("text=С пометками");
  assert((await s1.page.locator('[data-testid="thread"] audio').count()) === 1, "нет голосового в ленте");
  assert((await s1.page.locator('[data-testid="thread"] polyline').count()) >= 1, "нет линий пометок");
  await s1.page.waitForSelector("text=Отправить доработку");
  await shot(s1.page, "12-student-feedback-mobile");
});

await step("Студент отправляет доработку → админ принимает → прогресс 50%", async () => {
  const before = messagesTo(999).length;
  await s1.page.setInputFiles('[data-testid="file-input"]', [{ name: "fixed.png", mimeType: "image/png", buffer: png(600, 900) }]);
  await s1.page.waitForFunction(() => !document.body.innerText.includes("Файлы загружаются"), null, { timeout: 15000 });
  await s1.page.click("button:has-text('Отправить доработку')");
  await s1.page.waitForSelector("text=Работа отправлена");
  await s1.page.waitForTimeout(500);
  assert(messagesTo(999).slice(before).some((m) => m.text.includes("Доработка")), "админ не получил уведомление о доработке");

  await admin.page.goto(submissionUrl);
  await admin.page.click("text=Принять");
  await admin.page.fill('[data-testid="feedback-form"] textarea[name="text"]', "Теперь отлично!");
  await admin.page.click("text=Отправить разбор");
  await admin.page.waitForSelector("text=Работа принята.");
  await s1.page.goto(`${BASE}/progress`);
  const txt = await s1.page.locator("main").innerText();
  assert(/Пройдено 50%/.test(txt), `ожидалось 50%: ${txt.slice(0, 120)}`);
});

await step("Опрос после модуля: админ открывает, студент ставит 5 → тревога админу", async () => {
  await admin.page.goto(`${BASE}/admin/surveys`);
  const before = messagesTo(111).length;
  await admin.page.click("text=Открыть для всех");
  await admin.page.waitForSelector("text=Закрыть опрос");
  await admin.page.waitForTimeout(400);
  assert(messagesTo(111).slice(before).some((m) => m.text.includes("Оцени модуль")), "студент не получил приглашение на опрос");

  await s1.page.goto(`${BASE}/`);
  await s1.page.click("text=Оцени модуль");
  await s1.page.click('button[role="radio"]:has-text("5")');
  await s1.page.fill("#improve", "Хочется больше примеров.");
  const beforeAdmin = messagesTo(999).length;
  await s1.page.click("text=Отправить ответ");
  await s1.page.waitForSelector("text=Спасибо!");
  await s1.page.waitForTimeout(400);
  assert(messagesTo(999).slice(beforeAdmin).some((m) => m.text.includes("⚠️") && m.text.includes("5/10")), "админ не получил тревогу о низкой оценке");
  await admin.page.goto(`${BASE}/admin/surveys`);
  await admin.page.waitForSelector("text=Хочется больше примеров.");
  await shot(admin.page, "13-admin-surveys");
});

await step("Сводка показывает риски: низкая оценка, не заходившие студенты", async () => {
  await admin.page.goto(`${BASE}/admin`);
  await admin.page.waitForSelector("text=низкая оценка модуля: 5/10");
  const text = await admin.page.locator('[data-testid="risk-list"]').innerText();
  assert(text.includes("Тимур") && text.includes("ещё ни разу не заходил"), "нет риска «не заходил»");
  await shot(admin.page, "14-admin-dashboard-risks");
});

await step("Ежедневный cron: напоминание о дедлайне студенту и сводка админу", async () => {
  const unauthorized = await fetch(`${BASE}/api/cron/daily`);
  assert(unauthorized.status === 401, "cron доступен без секрета");
  const beforeS = messagesTo(111).length;
  const beforeA = messagesTo(999).length;
  const r = await fetch(`${BASE}/api/cron/daily`, { headers: { authorization: `Bearer ${CRON_SECRET}` } });
  const json = await r.json();
  assert(json.ok && json.dueSoon >= 1, `cron не отправил напоминание: ${JSON.stringify(json)}`);
  assert(messagesTo(111).slice(beforeS).some((m) => m.text.includes("Скоро дедлайн") && m.text.includes(newAssignmentTitle)), "студент не получил напоминание");
  assert(messagesTo(999).slice(beforeA).some((m) => m.text.includes("Сводка на сегодня")), "админ не получил сводку");
  const again = await (await fetch(`${BASE}/api/cron/daily`, { headers: { authorization: `Bearer ${CRON_SECRET}` } })).json();
  assert(again.dueSoon === 0, "повторный запуск дублирует напоминания");
});

await step("Админ создаёт нового студента, тот входит с выданным паролем", async () => {
  await admin.page.goto(`${BASE}/admin/students`);
  await admin.page.fill("#new-name", "Новый Студент");
  await admin.page.fill("#new-login", "newbie");
  await admin.page.click("text=Создать аккаунт");
  await admin.page.waitForSelector('[data-testid="credentials"]');
  const pass = await admin.page.textContent('[data-testid="cred-password"]');
  await shot(admin.page, "15-admin-students");
  const { page } = await newSession();
  await login(page, { login: "newbie", password: pass });
  await page.waitForSelector("text=Привет, Новый");
  await page.close();
});

await step("Сброс пароля и смена пароля студентом", async () => {
  // Student changes own password
  const { page } = await newSession();
  await login(page, USERS.s2);
  await page.goto(`${BASE}/profile`);
  await page.fill("#current", USERS.s2.password);
  await page.fill("#next", "brand-new-pass-1");
  await page.click("text=Сменить пароль");
  await page.waitForSelector("text=Пароль изменён");
  await page.reload();
  assert(new URL(page.url()).pathname === "/profile", "после смены пароля сессия слетела");
  await page.close();
  const { page: p2 } = await newSession();
  await login(p2, { login: USERS.s2.login, password: "brand-new-pass-1" });
  await p2.waitForSelector("text=Привет, Тимур");
  // Tимур sees his personal post
  await p2.goto(`${BASE}/board`);
  await p2.waitForSelector("text=Лично для Тимура");
  await p2.close();
});

await step("Health-эндпоинт", async () => {
  const r = await fetch(`${BASE}/api/health`, { headers: { authorization: `Bearer ${CRON_SECRET}` } });
  const j = await r.json();
  assert(r.ok && j.db === "ok", JSON.stringify(j));
});

await step("Скриншоты остальных экранов (десктоп и телефон)", async () => {
  await s1.page.goto(`${BASE}/`);
  await shot(s1.page, "16-student-home-after-mobile");
  await s1.page.goto(`${BASE}/lessons`);
  await shot(s1.page, "17-student-lessons-mobile");
  const { page } = await newSession();
  await login(page, USERS.s1);
  await page.goto(`${BASE}/`);
  await shot(page, "18-student-home-desktop");
  await page.goto(`${BASE}/homework`);
  await shot(page, "19-student-homework-desktop");
  await page.close();
  await admin.page.goto(`${BASE}/admin/reviews?tab=all`);
  await shot(admin.page, "20-admin-reviews");
});

await browser.close();
stopServer();
tg.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
writeFileSync(`${ART}/server.log`, serverLog);
if (failed.length) {
  console.log("Server log tail:\n" + serverLog.split("\n").slice(-30).join("\n"));
  process.exit(1);
}
process.exit(0);
