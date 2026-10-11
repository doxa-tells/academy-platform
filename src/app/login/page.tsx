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
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.png" alt="" className="size-24 drop-shadow-[0_0_24px_rgb(0_253_255/0.5)]" />
          <p className="glow mt-5 font-display text-[18px] leading-none text-cobalt">{APP_NAME}</p>
          <p className="mt-3 text-[13px] text-ink-2">личный кабинет курса</p>
        </div>
        <form action="/api/auth/login" method="post" className="border border-line-strong bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-line-strong px-4 py-2 text-[12px] text-muted">
            <span>academy@login:~</span>
            <span aria-hidden>[ ]</span>
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <h1 className="cursor font-display text-[13px] leading-relaxed text-ink">Вход</h1>
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
          </div>
        </form>
      </div>
    </main>
  );
}
