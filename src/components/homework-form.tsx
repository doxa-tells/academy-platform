"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { submitAttempt, type FormState } from "@/app/(student)/actions";
import { UploadPicker, useUploader } from "./uploader";
import { Button, Notice, Textarea } from "./ui";

export function HomeworkForm({ assignmentId, isRevision }: { assignmentId: string; isRevision: boolean }) {
  const uploader = useUploader("homework");
  const [state, action, pending] = useActionState<FormState, FormData>(submitAttempt, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      uploader.reset();
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const failed = uploader.items.some((i) => i.status === "error");

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5" data-testid="homework-form">
      <div>
        <h2 className="text-[17px] font-semibold text-ink">{isRevision ? "Отправить доработку" : "Сдать работу"}</h2>
        <p className="mt-0.5 text-sm text-ink-2">Фото, видео и пара слов о том, что получилось и где были сложности.</p>
      </div>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="attachments" value={JSON.stringify(uploader.results)} />
      <UploadPicker uploader={uploader} />
      <Textarea name="text" placeholder="Комментарий к работе (необязательно)" rows={3} maxLength={5000} />
      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok ? <Notice tone="success">{state.message}</Notice> : null}
      {failed ? <Notice tone="error">Некоторые файлы не загрузились — убери их или добавь заново.</Notice> : null}
      <Button type="submit" size="lg" disabled={pending || uploader.busy} className="w-full sm:w-auto">
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
        {uploader.busy ? "Файлы загружаются…" : isRevision ? "Отправить доработку" : "Отправить на проверку"}
      </Button>
    </form>
  );
}
