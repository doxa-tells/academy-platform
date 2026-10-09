"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword, type AccountState } from "@/app/account-actions";
import { Button, Field, Input, Notice } from "./ui";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<AccountState, FormData>(changePassword, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <Field label="Текущий пароль" htmlFor="current">
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Новый пароль" htmlFor="next" hint="Не короче 8 символов">
        <Input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok ? <Notice tone="success">{state.message}</Notice> : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        Сменить пароль
      </Button>
    </form>
  );
}
