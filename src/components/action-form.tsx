"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { ActionState } from "@/app/admin/actions";
import { Button, Notice, cn } from "./ui";

export function ActionForm({
  action,
  children,
  submitLabel,
  resetOnSuccess = true,
  className,
  testId,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  resetOnSuccess?: boolean;
  className?: string;
  testId?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={cn("space-y-4", className)} data-testid={testId}>
      {children}
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok && state.message && !state.password ? <Notice tone="success">{state.message}</Notice> : null}
      {state?.password ? (
        <div className="rounded-[var(--radius-control)] border-2 border-mark bg-mark-soft p-4" data-testid="credentials">
          <p className="text-sm font-medium text-ink">{state.message} Передай данные студенту — пароль больше не покажется:</p>
          <p className="mt-2 font-mono text-[15px] text-ink">
            Логин: <b data-testid="cred-login">{state.login}</b>
            <br />
            Пароль: <b data-testid="cred-password">{state.password}</b>
          </p>
        </div>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}

/** Two-step delete: first click arms, second click submits. No browser dialogs. */
export function ConfirmButton({ action, label = "Удалить", confirmLabel = "Точно удалить?", size = "sm" }: { action: () => Promise<void>; label?: string; confirmLabel?: string; size?: "sm" | "md" }) {
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Button
      variant="danger"
      size={size}
      disabled={pending}
      onClick={async () => {
        if (!armed) return setArmed(true);
        setPending(true);
        try {
          await action();
        } finally {
          setPending(false);
          setArmed(false);
        }
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
      {armed ? confirmLabel : label}
    </Button>
  );
}
