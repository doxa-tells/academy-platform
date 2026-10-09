import { Field, Input, Select, Textarea } from "./ui";
import { toLocalInputValue } from "@/lib/format";
import type { Assignment, Lesson, Module } from "@/lib/db/schema";

export function ModuleFields({ mod }: { mod?: Module }) {
  return (
    <>
      {mod ? <input type="hidden" name="id" value={mod.id} /> : null}
      <Field label="Название модуля" htmlFor={`mtitle-${mod?.id ?? "new"}`}>
        <Input id={`mtitle-${mod?.id ?? "new"}`} name="title" defaultValue={mod?.title} required maxLength={200} placeholder="Модуль 2. Свет и композиция" />
      </Field>
      <Field label="Короткое описание" htmlFor={`mdesc-${mod?.id ?? "new"}`}>
        <Textarea id={`mdesc-${mod?.id ?? "new"}`} name="description" defaultValue={mod?.description} rows={2} maxLength={2000} />
      </Field>
    </>
  );
}

export function LessonFields({ lesson, moduleId }: { lesson?: Lesson; moduleId?: string }) {
  const key = lesson?.id ?? `new-${moduleId}`;
  return (
    <>
      {lesson ? <input type="hidden" name="id" value={lesson.id} /> : <input type="hidden" name="moduleId" value={moduleId} />}
      <Field label="Название урока" htmlFor={`ltitle-${key}`}>
        <Input id={`ltitle-${key}`} name="title" defaultValue={lesson?.title} required maxLength={200} />
      </Field>
      <Field label="Ссылка на видео" htmlFor={`lvideo-${key}`} hint="YouTube (доступ по ссылке), Vimeo, Loom, Google Drive, Rutube или прямая ссылка на .mp4">
        <Input id={`lvideo-${key}`} name="videoUrl" defaultValue={lesson?.videoUrl} inputMode="url" placeholder="https://youtu.be/..." />
      </Field>
      <Field label="Описание и конспект" htmlFor={`ldesc-${key}`} hint="Markdown: **жирный**, списки, ссылки">
        <Textarea id={`ldesc-${key}`} name="description" defaultValue={lesson?.description} rows={lesson ? 10 : 4} />
      </Field>
      {!lesson ? (
        <label className="flex items-center gap-2 text-[15px] text-ink">
          <input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--color-cobalt)]" />
          Уведомить студентов в Telegram
        </label>
      ) : null}
    </>
  );
}

export function AssignmentFields({ assignment, moduleId, lessons }: { assignment?: Assignment; moduleId?: string; lessons: Lesson[] }) {
  const key = assignment?.id ?? `new-${moduleId}`;
  return (
    <>
      {assignment ? <input type="hidden" name="id" value={assignment.id} /> : <input type="hidden" name="moduleId" value={moduleId} />}
      <Field label="Название задания" htmlFor={`atitle-${key}`}>
        <Input id={`atitle-${key}`} name="title" defaultValue={assignment?.title} required maxLength={200} />
      </Field>
      <Field label="Что нужно сделать" htmlFor={`adesc-${key}`} hint="Markdown поддерживается">
        <Textarea id={`adesc-${key}`} name="description" defaultValue={assignment?.description} rows={assignment ? 8 : 4} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Срок сдачи" htmlFor={`adue-${key}`} hint="Время по Алматы. Напомню студенту за день.">
          <Input id={`adue-${key}`} name="dueAt" type="datetime-local" defaultValue={toLocalInputValue(assignment?.dueAt)} />
        </Field>
        <Field label="К уроку" htmlFor={`alesson-${key}`}>
          <Select id={`alesson-${key}`} name="lessonId" defaultValue={assignment?.lessonId ?? ""}>
            <option value="">— без привязки —</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {!assignment ? (
        <label className="flex items-center gap-2 text-[15px] text-ink">
          <input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--color-cobalt)]" />
          Уведомить студентов в Telegram
        </label>
      ) : null}
    </>
  );
}
