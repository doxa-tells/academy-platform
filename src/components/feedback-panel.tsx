"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, PenLine, RotateCcw } from "lucide-react";
import { sendFeedback, type ActionState } from "@/app/admin/actions";
import type { AnnotationData, SubmissionStatus } from "@/lib/db/schema";
import { Annotator } from "./annotator";
import { AnnotationOverlay, AnnotationPins } from "./attachments";
import { Recorder } from "./recorder";
import { UploadPicker, useUploader } from "./uploader";
import { Button, Notice, Textarea, cn } from "./ui";

type Decision = "comment" | "revision" | "accepted";

export function FeedbackPanel({
  submissionId,
  images,
  status,
}: {
  submissionId: string;
  images: { url: string; name: string }[];
  status: SubmissionStatus;
}) {
  const uploader = useUploader("feedback");
  const [decision, setDecision] = useState<Decision>(status === "accepted" ? "comment" : "accepted");
  const [annotations, setAnnotations] = useState<Record<string, AnnotationData>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(sendFeedback, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      uploader.reset();
      setAnnotations({});
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const annotationPayload = Object.entries(annotations)
    .filter(([, d]) => d.strokes.length || d.pins.length)
    .map(([url, annotation]) => ({ url, name: images.find((i) => i.url === url)?.name ?? "", annotation }));

  const options: { value: Decision; label: string; icon: typeof CheckCircle2; tone: string }[] = [
    { value: "accepted", label: "Принять", icon: CheckCircle2, tone: "border-st-accepted bg-st-accepted-bg text-st-accepted" },
    { value: "revision", label: "На доработку", icon: RotateCcw, tone: "border-st-revision bg-st-revision-bg text-st-revision" },
    { value: "comment", label: "Только комментарий", icon: MessageSquare, tone: "border-cobalt bg-cobalt-soft text-cobalt" },
  ];

  return (
    <form ref={formRef} action={action} className="space-y-5 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5" data-testid="feedback-form">
      <h2 className="text-[17px] font-semibold text-ink">Разбор</h2>
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="decision" value={decision} />
      <input type="hidden" name="attachments" value={JSON.stringify(uploader.results)} />
      <input type="hidden" name="annotations" value={JSON.stringify(annotationPayload)} />

      <Textarea name="text" rows={4} placeholder="Что получилось, что поправить и как" maxLength={10000} />

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Голос или видео</p>
        <Recorder onRecorded={(file) => uploader.addFiles([file])} />
      </div>

      {images.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Пометки на фото</p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {images.map((img) => {
              const ann = annotations[img.url];
              const has = !!ann && (ann.strokes.length > 0 || ann.pins.length > 0);
              return (
                <li key={img.url}>
                  <button
                    type="button"
                    onClick={() => setEditing(img.url)}
                    className={cn("group relative block w-full overflow-hidden rounded-xl border-2", has ? "border-mark" : "border-line")}
                    aria-label="Нарисовать пометки на фото"
                    data-testid="annotate-image"
                  >
                    <span className="relative block">
                      <img src={img.url} alt={img.name} className="block aspect-square w-full object-cover" />
                      {has ? (
                        <>
                          <AnnotationOverlay data={ann} />
                          <AnnotationPins data={ann} />
                        </>
                      ) : null}
                    </span>
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-ink/60 py-1 text-xs font-medium text-white">
                      <PenLine className="size-3.5" aria-hidden /> {has ? "Изменить" : "Пометить"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-cobalt">Приложить файл с примером</summary>
        <div className="mt-3">
          <UploadPicker uploader={uploader} accept="image/*,video/*,audio/*" label="Добавить файл" />
        </div>
      </details>
      {uploader.items.length > 0 ? (
        <p className="text-sm text-ink-2">
          Вложений: {uploader.items.length}
          {uploader.busy ? " · загружаются…" : ""}
        </p>
      ) : null}

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Решение</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {options.map((o) => {
            const Icon = o.icon;
            const active = decision === o.value;
            return (
              <label
                key={o.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border-2 px-3 py-2.5 text-[15px] font-medium transition-colors",
                  active ? o.tone : "border-line bg-surface text-ink-2 hover:border-line-strong",
                )}
              >
                <input type="radio" name="decision-choice" value={o.value} checked={active} onChange={() => setDecision(o.value)} className="sr-only" />
                <Icon className="size-5" aria-hidden />
                {o.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {state?.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state?.ok ? <Notice tone="success">{state.message} Студент получит уведомление.</Notice> : null}

      <Button type="submit" size="lg" disabled={pending || uploader.busy} className="w-full sm:w-auto">
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
        {uploader.busy ? "Файлы загружаются…" : "Отправить разбор"}
      </Button>

      {editing ? (
        <Annotator
          url={editing}
          initial={annotations[editing]}
          onSave={(data) => setAnnotations((prev) => ({ ...prev, [editing]: data }))}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </form>
  );
}
