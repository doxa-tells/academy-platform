import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { appUrl, getSetting } from "@/lib/settings";
import { escapeHtml, getBotToken, tgCall } from "@/lib/telegram";

type Update = {
  message?: { text?: string; chat: { id: number; type: string }; from?: { username?: string; first_name?: string } };
};

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || (await getSetting("telegram_webhook_secret"));
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const token = await getBotToken();
  const update = (await req.json().catch(() => ({}))) as Update;
  const msg = update.message;
  if (!token || !msg || msg.chat.type !== "private") return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);
  const reply = (text: string) => tgCall(token, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
  const text = (msg.text || "").trim();

  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1];
    if (code) {
      const user = await db.query.users.findFirst({ where: eq(schema.users.telegramLinkCode, code) });
      if (user) {
        await db
          .update(schema.users)
          .set({ telegramChatId: chatId, telegramUsername: msg.from?.username ?? null })
          .where(eq(schema.users.id, user.id));
        await reply(
          user.role === "admin"
            ? `✅ <b>Готово, ${escapeHtml(user.name)}!</b>\nСюда будут приходить новые домашки, оценки модулей и утренняя сводка.`
            : `✅ <b>Готово, ${escapeHtml(user.name)}!</b>\nПришлю разбор твоих работ, новые посты и напомню о дедлайнах.`,
        );
        return NextResponse.json({ ok: true });
      }
      await reply("Ссылка устарела. Открой профиль на платформе и нажми «Подключить Telegram» ещё раз.");
      return NextResponse.json({ ok: true });
    }
    await reply(`Привет! Чтобы получать уведомления, открой профиль на платформе и нажми «Подключить Telegram»:\n${appUrl()}/profile`);
    return NextResponse.json({ ok: true });
  }

  await reply("Я присылаю уведомления платформы курса. Вопросы лучше писать преподавателю лично или в комментарии к домашке.");
  return NextResponse.json({ ok: true });
}
