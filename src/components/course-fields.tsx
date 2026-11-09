import { Field, Input, Select, Textarea } from "./ui";
import type { Assignment, Lesson, Module } from "@/lib/db/schema";

export function ModuleFields({ mod }: { mod?: Module }) {
  return (
    <>
      {mod ? <input type="hidden" name="id" value={mod.id} /> : null}
      <Field label="Название модуля" htmlFor={`mtitle-${mod?.id ?? "new"}`}>
        <Input id={`mtitle-${mod?.id ?? "new"}`} name="title" defaultValue={mod?.title} required maxLength={200} placeholder="Урок 9. Название урока" />
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
      <Field label="Описание и конспект" htmlFor={`ldesc-${key}`} hint="Markdown: **жирный**, списки, ссылки. Запись урока вставляется во вкладке «Курс» — у каждого потока своя.">
        <Textarea id={`ldesc-${key}`} name="description" defaultValue={lesson?.description} rows={lesson ? 10 : 4} />
      </Field>
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
      <Field label="К уроку" htmlFor={`alesson-${key}`} hint="Задание открывается потоку вместе с этим уроком. Срок сдачи ставится во вкладке «Курс».">
        <Select id={`alesson-${key}`} name="lessonId" defaultValue={assignment?.lessonId ?? ""}>
          <option value="">— без привязки —</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </Select>
      </Field>
      {!assignment ? (
        <label className="flex items-center gap-2 text-[15px] text-ink">
          <input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--color-cobalt)]" />
          Уведомить студентов, у которых урок уже открыт
        </label>
      ) : null}
    </>
  );
}
