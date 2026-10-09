import "server-only";
import { randomBytes } from "node:crypto";
import { appUrl, getSetting, setSetting } from "./settings";

const API_BASE = () => (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/$/, "");

export async function getBotToken(): Promise<string | null> {
  return process.env.TELEGRAM_BOT_TOKEN || (await getSetting("telegram_bot_token"));
}

export async function getBotUsername(): Promise<string | null> {
  return getSetting("telegram_bot_username");
}

type TgResult<T> = { ok: boolean; result?: T; description?: string };

export async function tgCall<T = unknown>(token: string, method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API_BASE()}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }))) as TgResult<T>;
  return data;
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Sends a message; never throws (notifications must not break the main action). */
export async function sendTelegram(chatId: string, html: string, link?: { path: string; label: string }) {
  try {
    const token = await getBotToken();
    if (!token) return false;
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    };
    if (link) {
      const url = `${appUrl()}${link.path}`;
      // Telegram rejects inline buttons pointing to localhost; send a plain link instead.
      if (url.startsWith("https://")) {
        payload.reply_markup = { inline_keyboard: [[{ text: link.label, url }]] };
      } else {
        payload.text = `${html}\n\n${escapeHtml(url)}`;
      }
    }
    const res = await tgCall(token, "sendMessage", payload);
    if (!res.ok) console.error("[telegram] sendMessage failed:", res.description);
    return res.ok;
  } catch (e) {
    console.error("[telegram] send error", e);
    return false;
  }
}

/** Validates the token, registers the webhook and remembers the bot username. */
export async function setupBot(token: string) {
  const me = await tgCall<{ username: string; first_name: string }>(token, "getMe", {});
  if (!me.ok || !me.result) {
    return { ok: false as const, error: "Telegram не принял токен. Проверь, что скопировал его целиком из @BotFather." };
  }
  let secret = process.env.TELEGRAM_WEBHOOK_SECRET || (await getSetting("telegram_webhook_secret"));
  if (!secret) {
    secret = randomBytes(24).toString("hex");
    await setSetting("telegram_webhook_secret", secret);
  }
  const webhookUrl = `${appUrl()}/api/telegram/webhook`;
  let webhookOk = false;
  let webhookError: string | undefined;
  if (webhookUrl.startsWith("https://")) {
    const hook = await tgCall(token, "setWebhook", {
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message"],
      drop_pending_updates: true,
    });
    webhookOk = hook.ok;
    webhookError = hook.description;
  } else {
    webhookError = "Вебхук работает только на опубликованном сайте (https).";
  }
  await setSetting("telegram_bot_username", me.result.username);
  await tgCall(token, "setMyCommands", {
    commands: [{ command: "start", description: "Подключить уведомления" }],
  });
  return { ok: true as const, username: me.result.username, webhookOk, webhookError };
}
