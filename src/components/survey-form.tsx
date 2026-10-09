"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { submitSurvey, type FormState } from "@/app/(student)/actions";
import { Button, Notice, Textarea, cn } from "./ui";

export function SurveyForm({ moduleId, initialScore, initialImprove }: { moduleId: string; initialScore?: number; initialImprove?: string }) {
  const [score, setScore] = useState<number | null>(initialScore ?? null);
  const [state, action, pending] = useActionState<FormState, FormData>(submitSurvey, null);

  if (state?.ok) {
    return (
      <div className="space-y-4">
        <Notice tone="success">{state.message}</Notice>
        <Link href="/" className="text-sm font-medium text-cobalt hover:underline">
          На главную
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="score" value={score ?? ""} />
      <fieldset>
        <legend className="mb-3 text-[15px] font-medium text-ink">Насколько полезным был модуль?</legend>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10" role="radiogroup" aria-label="Оценка от 1 до 10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={score === n}
              onClick={() => setScore(n)}
              className={cn(
                "h-12 rounded-[var(--radius-control)] border text-[17px] font-semibold tabular-nums transition-colors",
                score === n ? "border-cobalt bg-cobalt text-white" : "border-line-strong bg-surface text-ink hover:border-ink-2",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>совсем не полезно</span>
          <span>очень полезно</span>
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <label htmlFor="improve" className="block text-[15px] font-medium text-ink">
          Что улучшить?
        </label>
        <Textarea id="improve" name="improve" rows={4} defaultValue={initialImprove} placeholder="Что было непонятно, чего не хватило, что убрать" />
      </div>
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Button type="submit" size="lg" disabled={pending || !score}>
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
        Отправить ответ
      </Button>
    </form>
  );
}
