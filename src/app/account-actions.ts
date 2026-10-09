"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { checkPassword, hashPassword, requireUser, setSessionCookie } from "@/lib/auth";

export type AccountState = { ok?: boolean; error?: string; message?: string } | null;

export async function changePassword(_prev: AccountState, form: FormData): Promise<AccountState> {
  const user = await requireUser();
  const current = String(form.get("current") || "");
  const next = String(form.get("next") || "");
  if (next.length < 8) return { error: "Новый пароль должен быть не короче 8 символов." };
  if (!(await checkPassword(current, user.passwordHash))) return { error: "Текущий пароль введён неверно." };
  const [updated] = await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(next), sessionVersion: user.sessionVersion + 1 })
    .where(eq(schema.users.id, user.id))
    .returning();
  await setSessionCookie(updated);
  return { ok: true, message: "Пароль изменён." };
}

export async function disconnectTelegram() {
  const user = await requireUser();
  await db
    .update(schema.users)
    .set({ telegramChatId: null, telegramUsername: null })
    .where(eq(schema.users.id, user.id));
  revalidatePath("/", "layout");
}
