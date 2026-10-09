import { eq } from "drizzle-orm";
import { requireStudent, generateLinkCode } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getBotUsername } from "@/lib/telegram";
import { Card, PageHeader, SectionTitle, Avatar } from "@/components/ui";
import { TelegramConnect } from "@/components/telegram-connect";
import { ChangePasswordForm } from "@/components/account-forms";

export const metadata = { title: "Профиль" };

export default async function ProfilePage() {
  const user = await requireStudent();
  let code = user.telegramLinkCode;
  if (!code) {
    code = generateLinkCode();
    await db.update(schema.users).set({ telegramLinkCode: code }).where(eq(schema.users.id, user.id));
  }
  const botUsername = await getBotUsername();

  return (
    <div className="space-y-6">
      <PageHeader title="Профиль" />
      <Card className="flex items-center gap-4 p-5">
        <Avatar name={user.name} size={52} />
        <div>
          <p className="text-[17px] font-semibold text-ink">{user.name}</p>
          <p className="text-sm text-ink-2">Логин: {user.login}</p>
        </div>
      </Card>
      <Card className="p-5">
        <SectionTitle>Уведомления в Telegram</SectionTitle>
        <TelegramConnect botUsername={botUsername} linkCode={code} chatId={user.telegramChatId} tgUsername={user.telegramUsername} audience="student" />
      </Card>
      <Card className="p-5">
        <SectionTitle>Пароль</SectionTitle>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
