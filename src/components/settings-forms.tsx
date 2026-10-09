"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { reconnectBot, saveBotToken, sendTestMessage, type ActionState } from "@/app/admin/actions";
import { Button, Field, Input, Notice } from "./ui";

export function BotTokenForm({ connected }: { connected: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveBotToken, null);
  return (
    <form action={action} className="space-y-3">
      <Field label={connected ? "Заменить токен бота" : "Токен бота"} htmlFor="token" hint="Получи в @BotFather: /newbot → имя → username → скопируй токен">
        <Input id="token" name="token" placeholder="123456789:AAF..." autoComplete="off" spellCheck={false} />
      </Field>
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok ? <Notice tone="success">{state.message}</Notice> : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Подключить бота
      </Button>
    </form>
  );
}

export function BotTools() {
  const [testState, testAction, testPending] = useActionState<ActionState, FormData>(sendTestMessage, null);
  const [hookState, hookAction, hookPending] = useActionState<ActionState, FormData>(reconnectBot, null);
  const state = testState ?? hookState;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <form action={testAction}>
          <Button type="submit" variant="secondary" size="sm" disabled={testPending}>
            Отправить себе тест
          </Button>
        </form>
        <form action={hookAction}>
          <Button type="submit" variant="ghost" size="sm" disabled={hookPending}>
            Переподключить вебхук
          </Button>
        </form>
      </div>
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok ? <Notice tone="success">{state.message}</Notice> : null}
    </div>
  );
}
