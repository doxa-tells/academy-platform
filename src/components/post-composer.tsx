"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createPost, type ActionState } from "@/app/admin/actions";
import { Button, Field, Input, Notice, Select, Textarea, cn } from "./ui";

export function PostComposer({ students }: { students: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createPost, null);
  const [kind, setKind] = useState("note");
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setKind("note");
      setAudience("all");
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5" data-testid="post-composer">
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <Field label="Тип" htmlFor="kind">
          <Select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="note">Заметка</option>
            <option value="prompt">Промпт</option>
            <option value="link">Ссылка</option>
            <option value="announcement">Объявление</option>
          </Select>
        </Field>
        <Field label="Заголовок" htmlFor="title">
          <Input id="title" name="title" required maxLength={300} placeholder={kind === "prompt" ? "Промпт для разбора композиции" : "О чём пост"} />
        </Field>
      </div>
      <Field
        label={kind === "prompt" ? "Текст промпта" : "Текст"}
        htmlFor="body"
        hint={kind === "prompt" ? "У студента будет кнопка «Скопировать промпт»" : "Поддерживается Markdown: **жирный**, списки, ссылки, блоки кода с кнопкой копирования"}
      >
        <Textarea id="body" name="body" rows={kind === "prompt" ? 7 : 5} className={kind === "prompt" ? "font-mono text-[14px]" : ""} />
      </Field>
      <Field label="Ссылка (необязательно)" htmlFor="url">
        <Input id="url" name="url" type="text" inputMode="url" placeholder="https://" />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">Кому</legend>
        <div className="flex flex-wrap gap-2">
          {(["all", "selected"] as const).map((a) => (
            <label
              key={a}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium ring-1",
                audience === a ? "bg-cobalt text-white ring-cobalt" : "bg-surface text-ink-2 ring-line-strong",
              )}
            >
              <input type="radio" name="audience" value={a} checked={audience === a} onChange={() => setAudience(a)} className="sr-only" />
              {a === "all" ? "Всем студентам" : "Выбранным"}
            </label>
          ))}
        </div>
        {audience === "selected" ? (
          <div className="flex flex-wrap gap-3 pt-1">
            {students.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-[15px] text-ink">
                <input type="checkbox" name="targets" value={s.id} className="size-4 accent-[var(--color-cobalt)]" />
                {s.name}
              </label>
            ))}
            {students.length === 0 ? <p className="text-sm text-muted">Сначала добавь студентов.</p> : null}
          </div>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-[15px] text-ink">
          <input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--color-cobalt)]" />
          Уведомить в Telegram
        </label>
        <label className="flex items-center gap-2 text-[15px] text-ink">
          <input type="checkbox" name="pinned" className="size-4 accent-[var(--color-cobalt)]" />
          Закрепить наверху
        </label>
      </div>

      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok ? <Notice tone="success">{state.message}</Notice> : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Опубликовать
      </Button>
    </form>
  );
}
