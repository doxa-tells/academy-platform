import { eq } from "drizzle-orm";
import { requireAdmin, generateLinkCode } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getBotToken, getBotUsername } from "@/lib/telegram";
import { STORAGE_MODE, MAX_UPLOAD_MB } from "@/lib/config";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { TelegramConnect } from "@/components/telegram-connect";
import { ChangePasswordForm } from "@/components/account-forms";
import { BotTokenForm, BotTools } from "@/components/settings-forms";
import { removeBot } from "../actions";

export const metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  let code = admin.telegramLinkCode;
  if (!code) {
    code = generateLinkCode();
    await db.update(schema.users).set({ telegramLinkCode: code }).where(eq(schema.users.id, admin.id));
  }
  const [token, botUsername] = await Promise.all([getBotToken(), getBotUsername()]);
  const fromEnv = !!process.env.TELEGRAM_BOT_TOKEN;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Настройки" />

      <Card className="space-y-5 p-5">
        <SectionTitle>Telegram-бот</SectionTitle>
        {token && botUsername ? (
          <p className="text-[15px] text-ink">
            Подключён бот <a className="font-medium text-cobalt underline" href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer">@{botUsername}</a>.
            Студенты подключают уведомления в своём профиле.
          </p>
        ) : null}
        {!fromEnv ? <BotTokenForm connected={!!token} /> : <p className="text-sm text-ink-2">Токен задан в переменных окружения сервера.</p>}
        {token && !fromEnv ? (
          <form action={removeBot}>
            <button type="submit" className="text-sm text-st-revision hover:underline">
              Отключить бота
            </button>
          </form>
        ) : null}
      </Card>

      <Card className="space-y-4 p-5">
        <SectionTitle>Мои уведомления</SectionTitle>
        <TelegramConnect botUsername={botUsername} linkCode={code} chatId={admin.telegramChatId} tgUsername={admin.telegramUsername} audience="admin" />
        {token ? <BotTools /> : null}
        <p className="text-sm text-ink-2">
          Каждый день в 9:00 по Алматы студентам уходят напоминания о дедлайнах на завтра, а тебе — сводка: что ждёт проверки и кто отстаёт.
        </p>
      </Card>

      <Card className="p-5">
        <SectionTitle>Пароль администратора</SectionTitle>
        <ChangePasswordForm />
      </Card>

      <p className="text-xs text-muted">
        Хранилище файлов: {STORAGE_MODE === "local" ? "локальная папка (режим разработки)" : "Vercel Blob"} · до {MAX_UPLOAD_MB} МБ на файл
      </p>
    </div>
  );
}
