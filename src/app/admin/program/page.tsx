import Link from "next/link";
import { ArrowDown, ArrowUp, BookOpen, ClipboardList, Pencil } from "@/components/icons";
import { getCourseTree } from "@/lib/course";
import { ActionForm } from "@/components/action-form";
import { AssignmentFields, LessonFields, ModuleFields } from "@/components/course-fields";
import { Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { LessonArt } from "@/components/lesson-art";
import { createAssignment, createLesson, createModule, move } from "../actions";

export const metadata = { title: "Программа" };

function MoveButtons({ kind, id, first, last }: { kind: "module" | "lesson" | "assignment"; id: string; first: boolean; last: boolean }) {
  return (
    <div className="flex shrink-0">
      <form action={move.bind(null, kind, id, "up")}>
        <button type="submit" disabled={first} className="p-1.5 text-ink-2 hover:bg-cobalt/10 disabled:opacity-25" aria-label="Выше">
          <ArrowUp className="size-4" />
        </button>
      </form>
      <form action={move.bind(null, kind, id, "down")}>
        <button type="submit" disabled={last} className="p-1.5 text-ink-2 hover:bg-cobalt/10 disabled:opacity-25" aria-label="Ниже">
          <ArrowDown className="size-4" />
        </button>
      </form>
    </div>
  );
}

/** Общая программа: модули, уроки и задания одинаковы для всех потоков. */
export default async function ProgramPage() {
  const tree = await getCourseTree();
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Программа"
        subtitle="Общая для всех потоков: названия, конспекты и тексты заданий. Открывать уроки, вставлять записи и ставить сроки — во вкладке «Курс» у каждого потока."
      />

      {tree.length === 0 ? <EmptyState title="Программа пуста" text="Начни с первого модуля ниже." /> : null}

      {tree.map((m, mi) => (
        <Card key={m.id} className="overflow-hidden" data-testid="module-card">
          <div className="flex items-start gap-3 border-b border-line bg-paper/60 px-4 py-3">
            <LessonArt title={m.title} index={mi} size="sm" />
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] font-semibold leading-snug text-ink">{m.title}</h2>
              {m.description ? <p className="mt-0.5 text-sm text-ink-2">{m.description}</p> : null}
            </div>
            <MoveButtons kind="module" id={m.id} first={mi === 0} last={mi === tree.length - 1} />
            <Link href={`/admin/course/module/${m.id}`} className="p-1.5 text-ink-2 hover:bg-cobalt/10" aria-label="Редактировать модуль">
              <Pencil className="size-4" />
            </Link>
          </div>

          <div className="space-y-5 p-4">
            <div>
              <p className="mb-2 text-sm font-medium text-ink-2">Уроки</p>
              {m.lessons.length === 0 ? <p className="text-sm text-muted">Уроков пока нет.</p> : null}
              <ul className="space-y-1">
                {m.lessons.map((l, i) => (
                  <li key={l.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-paper">
                    <BookOpen className="size-4 shrink-0 text-cobalt" aria-hidden />
                    <Link href={`/admin/course/lesson/${l.id}`} className="min-w-0 flex-1 truncate text-[15px] text-ink hover:text-cobalt">
                      {l.title}
                    </Link>
                    <MoveButtons kind="lesson" id={l.id} first={i === 0} last={i === m.lessons.length - 1} />
                  </li>
                ))}
              </ul>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-cobalt">+ Добавить урок</summary>
                <div className="mt-3 border border-line p-4">
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
                  <li key={a.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-paper">
                    <ClipboardList className="size-4 shrink-0 text-cobalt" aria-hidden />
                    <Link href={`/admin/course/assignment/${a.id}`} className="min-w-0 flex-1 truncate text-[15px] text-ink hover:text-cobalt">
                      {a.title}
                    </Link>
                    <MoveButtons kind="assignment" id={a.id} first={i === 0} last={i === m.assignments.length - 1} />
                  </li>
                ))}
              </ul>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-cobalt">+ Добавить задание</summary>
                <div className="mt-3 border border-line p-4">
                  <ActionForm action={createAssignment} submitLabel="Добавить задание" testId="new-assignment-form">
                    <AssignmentFields moduleId={m.id} lessons={m.lessons} />
                  </ActionForm>
                </div>
              </details>
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
