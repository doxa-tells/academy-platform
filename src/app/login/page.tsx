import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button, Input, Field, Notice } from "@/components/ui";
import { APP_NAME } from "@/lib/config";

const ERRORS: Record<string, string> = {
  invalid: "Неверный логин или пароль. Проверь раскладку и попробуй ещё раз.",
  empty: "Введи логин и пароль.",
  locked: "Слишком много попыток. Вход временно закрыт на 15 минут.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; login?: string; next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/");
  const { error, login, next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center gap-3">
          <img src="/icon.svg" alt="" className="size-11" />
          <div>
            <p className="font-display text-xl font-semibold leading-none text-ink">{APP_NAME}</p>
            <p className="mt-1.5 text-sm text-ink-2">Личный кабинет курса</p>
          </div>
        </div>
        <form action="/api/auth/login" method="post" className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-6">
          <h1 className="text-lg font-semibold text-ink">Вход</h1>
          {error ? <Notice tone="error">{ERRORS[error] ?? ERRORS.invalid}</Notice> : null}
          <input type="hidden" name="next" value={next ?? ""} />
          <Field label="Логин" htmlFor="login">
            <Input id="login" name="login" autoComplete="username" autoCapitalize="none" spellCheck={false} defaultValue={login ?? ""} required />
          </Field>
          <Field label="Пароль" htmlFor="password">
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </Field>
          <Button type="submit" size="lg" className="w-full">
            Войти
          </Button>
          <p className="text-center text-xs text-muted">Логин и пароль выдаёт преподаватель</p>
        </form>
      </div>
    </main>
  );
}
