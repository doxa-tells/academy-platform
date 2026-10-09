import { BellRing, CheckCircle2, Send } from "lucide-react";
import { disconnectTelegram } from "@/app/account-actions";
import { Button, buttonClass } from "./ui";

export function TelegramConnect({
  botUsername,
  linkCode,
  chatId,
  tgUsername,
  audience,
}: {
  botUsername: string | null;
  linkCode: string;
  chatId: string | null;
  tgUsername: string | null;
  audience: "student" | "admin";
}) {
  if (!botUsername) {
    return (
      <div className="flex items-start gap-3 text-[15px] text-ink-2">
        <BellRing className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
        <p>
          {audience === "admin"
            ? "Бот ещё не подключён. Вставь токен от @BotFather в настройках ниже."
            : "Уведомления в Telegram скоро заработают — преподаватель подключает бота."}
        </p>
      </div>
    );
  }
  if (chatId) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <CheckCircle2 className="size-5 text-st-accepted" aria-hidden />
        <p className="flex-1 text-[15px] text-ink">
          Подключено{tgUsername ? ` к @${tgUsername}` : ""}. Уведомления приходят от @{botUsername}.
        </p>
        <form action={disconnectTelegram}>
          <Button type="submit" variant="ghost" size="sm">
            Отключить
          </Button>
        </form>
      </div>
    );
  }
  const link = `https://t.me/${botUsername}?start=${linkCode}`;
  return (
    <div className="space-y-3">
      <p className="text-[15px] text-ink-2">
        {audience === "admin"
          ? "Нажми кнопку, в Telegram откроется бот — нажми «Start». Сюда будут приходить новые домашки и сводка за день."
          : "Нажми кнопку, в Telegram откроется бот — нажми «Start». Пришлю разбор домашки, новые посты и напомню о дедлайнах."}
      </p>
      <a href={link} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")} data-testid="telegram-link">
        <Send className="size-4" aria-hidden /> Подключить Telegram
      </a>
    </div>
  );
}
