import Link from "next/link";
import { ArrowDown, ArrowUp, ClipboardList, Pencil, PlayCircle, VideoOff } from "lucide-react";
import { getCourseTree } from "@/lib/course";
import { formatDateTime } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { AssignmentFields, LessonFields, ModuleFields } from "@/components/course-fields";
import { Card, EmptyState, PageHeader, SectionTitle, cn } from "@/components/ui";
import { createAssignment, createLesson, createModule, move, setSurveyOpen } from "../actions";

export const metadata = { title: "Курс" };

function MoveButtons({ kind, id, first, last }: { kind: "module" | "lesson" | "assignment"; id: string; first: boolean; last: boolean }) {
  return (
    <div className="flex shrink-0">
      <form action={move.bind(null, kind, id, "up")}>
        <button type="submit" disabled={first} className="rounded-md p-1.5 text-ink-2 hover:bg-ink/5 disabled:opacity-25" aria-label="Выше">
          <ArrowUp className="size-4" />
        </button>
      </form>
      <form action={move.bind(null, kind, id, "down")}>
        <button type="submit" disabled={last} className="rounded-md p-1.5 text-ink-2 hover:bg-ink/5 disabled:opacity-25" aria-label="Ниже">
          <ArrowDown className="size-4" />
        </button>
      </form>
    </div>
  );
}

export default async function CoursePage() {
  const tree = await getCourseTree();
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Курс" subtitle="Модули, видео-уроки и задания с дедлайнами" />

      {tree.length === 0 ? <EmptyState title="Курс пуст" text="Начни с первого модуля ниже." /> : null}

      {tree.map((m, mi) => (
        <Card key={m.id} className="overflow-hidden" data-testid="module-card">
          <div className="flex items-start gap-3 border-b border-line bg-paper/60 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-semibold text-ink">{m.title}</h2>
              {m.description ? <p className="mt-0.5 text-sm text-ink-2">{m.description}</p> : null}
            </div>
            <MoveButtons kind="module" id={m.id} first={mi === 0} last={mi === tree.length - 1} />
            <Link href={`/admin/course/module/${m.id}`} className="rounded-md p-1.5 text-ink-2 hover:bg-ink/5" aria-label="Редактировать модуль">
              <Pencil className="size-4" />
            </Link>
          </div>

          <div className="space-y-5 p-4">
            <div>
              <p className="mb-2 text-sm font-medium text-ink-2">Уроки</p>
              {m.lessons.length === 0 ? <p className="text-sm text-muted">Уроков пока нет.</p> : null}
              <ul className="space-y-1">
                {m.lessons.map((l, i) => (
                  <li key={l.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-paper">
                    {l.videoUrl ? <PlayCircle className="size-4 shrink-0 text-cobalt" aria-label="Есть видео" /> : <VideoOff className="size-4 shrink-0 text-muted" aria-label="Нет видео" />}
                    <Link href={`/admin/course/lesson/${l.id}`} className="min-w-0 flex-1 truncate text-[15px] text-ink hover:text-cobalt">
                      {l.title}
                    </Link>
                    <MoveButtons kind="lesson" id={l.id} first={i === 0} last={i === m.lessons.length - 1} />
                  </li>
                ))}
              </ul>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-cobalt">+ Добавить урок</summary>
                <div className="mt-3 rounded-xl border border-line p-4">
                  <ActionForm action={createLesson} submitLabel="Добавить урок" testId="new-lesson-form">
                    <LessonFields moduleId={m.id} />
                  </ActionForm>
                </div>
              </details>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink-2">Задания</p>
              {m.assignments.length === 0 ? <p className="text-sm text-muted">Заданий пока нет.</p> : null}
              <ul className="space-y-1">
                {m.assignments.map((a, i) => (
                  <li key={a.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-paper">
                    <ClipboardList className="size-4 shrink-0 text-cobalt" aria-hidden />
                    <Link href={`/admin/course/assignment/${a.id}`} className="min-w-0 flex-1 truncate text-[15px] text-ink hover:text-cobalt">
                      {a.title}
                    </Link>
                    <span className={cn("hidden shrink-0 text-xs sm:inline", a.dueAt ? "text-ink-2" : "text-muted")}>
                      {a.dueAt ? `до ${formatDateTime(a.dueAt)}` : "без срока"}
                    </span>
                    <MoveButtons kind="assignment" id={a.id} first={i === 0} last={i === m.assignments.length - 1} />
                  </li>
                ))}
              </ul>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-cobalt">+ Добавить задание</summary>
                <div className="mt-3 rounded-xl border border-line p-4">
                  <ActionForm action={createAssignment} submitLabel="Добавить задание" testId="new-assignment-form">
                    <AssignmentFields moduleId={m.id} lessons={m.lessons} />
                  </ActionForm>
                </div>
              </details>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2.5">
              <p className="text-sm text-ink-2">
                Опрос после модуля:{" "}
                <span className="font-medium text-ink">{m.surveyOpen ? "открыт для всех" : "откроется сам, когда студент пройдёт модуль"}</span>
              </p>
              <form action={setSurveyOpen.bind(null, m.id, !m.surveyOpen)}>
                <button type="submit" className="text-sm font-medium text-cobalt hover:underline">
                  {m.surveyOpen ? "Закрыть" : "Открыть сейчас"}
                </button>
              </form>
            </div>
          </div>
        </Card>
      ))}

      <section>
        <SectionTitle>Новый модуль</SectionTitle>
        <Card className="p-4 sm:p-5">
          <ActionForm action={createModule} submitLabel="Добавить модуль" testId="new-module-form">
            <ModuleFields />
          </ActionForm>
        </Card>
      </section>
    </div>
  );
}
