"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/app/admin/actions";
import { cn } from "./ui";

/** Маленькая форма в одну строку: поле + «Сохранить» + результат рядом. */
export function InlineForm({
  action,
  children,
  submitLabel = "Сохранить",
  testId,
  className,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel?: string;
  testId?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  return (
    <form action={formAction} className={cn("flex flex-wrap items-center gap-2", className)} data-testid={testId}>
      {children}
      <button
        type="submit"
        disabled={pending}
        className="h-9 shrink-0 bg-cobalt px-3 text-sm font-semibold text-black disabled:opacity-60"
      >
        {pending ? "…" : submitLabel}
      </button>
      {state?.error ? (
        <span className="text-sm text-st-revision" role="alert">
          {state.error}
        </span>
      ) : state?.message ? (
        <span className="text-sm text-st-accepted" role="status">
          ✓ {state.message}
        </span>
      ) : null}
    </form>
  );
}
