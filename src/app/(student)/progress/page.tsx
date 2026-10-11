import Link from "next/link";
import { Check, CheckCircle2, Circle, ClipboardList, PlayCircle, Sparkles } from "@/components/icons";
import { requireStudent } from "@/lib/auth";
import { assignmentState, computeProgress, getCourseTree, getStudentState } from "@/lib/course";
import { EmptyState, PageHeader, ProgressBar, StatusBadge, cn } from "@/components/ui";
import { lessonLabel } from "@/lib/format";
import { LessonArt } from "@/components/lesson-art";

export const metadata = { title: "Прогресс" };

export default async function ProgressPage() {
  const user = await requireStudent();
  const [tree, state] = await Promise.all([getCourseTree(), getStudentState(user.id)]);
  const progress = computeProgress(tree, state);

  return (
    <div>
      <PageHeader title="Карта прогресса" subtitle={`Пройдено ${progress.percent}% курса · ${progress.done} из ${progress.total} шагов`} />
      <ProgressBar value={progress.percent} className="mb-8 h-2.5" />
      {progress.modules.length === 0 ? (
        <EmptyState title="Курс ещё собирается" text="Модули появятся здесь, как только преподаватель их добавит." />
      ) : (
        <ol className="relative">
          {progress.modules.map((mp, i) => {
            const last = i === progress.modules.length - 1;
            return (
              <li key={mp.module.id} className="relative pb-8 pl-14 last:pb-0 sm:pl-[112px]">
                {!last ? (
                  <span
                    className={cn("absolute bottom-0 left-[19px] top-11 w-[2px] sm:left-[43px] sm:top-[92px]", mp.complete ? "bg-cobalt" : "bg-line-strong")}
                    aria-hidden
                  />
                ) : null}
                <span className="absolute left-0 top-0" aria-hidden>
                  <LessonArt title={mp.module.title} index={i} size="sm" className={cn("sm:hidden", mp.done === 0 && "opacity-75")} />
                  <LessonArt title={mp.module.title} index={i} className={cn("hidden sm:block", mp.done === 0 && "opacity-75")} />
                  {mp.complete ? (
                    <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center bg-st-accepted text-black">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </span>
                <div className="border border-line bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="text-[16px] font-semibold leading-snug text-ink">{mp.module.title}</h2>
                  <span className="text-sm tabular-nums text-ink-2">{mp.percent}%</span>
                </div>
                {mp.module.description ? <p className="mt-1 text-sm text-ink-2">{mp.module.description}</p> : null}

                <ul className="mt-3 space-y-1.5">
                  {mp.module.lessons.map((l, li) => {
                    const done = state.completed.has(l.id);
                    return (
                      <li key={l.id}>
                        <Link href={`/lessons/${l.id}`} className="flex items-center gap-2.5 rounded-lg py-1 text-[15px] hover:text-cobalt">
                          {done ? (
                            <CheckCircle2 className="size-[18px] shrink-0 text-st-accepted" aria-label="Пройден" />
                          ) : (
                            <Circle className="size-[18px] shrink-0 text-line-strong" aria-label="Не пройден" />
                          )}
                          <PlayCircle className="size-4 shrink-0 text-muted" aria-hidden />
                          <span className={cn("min-w-0 truncate", done ? "text-ink-2" : "text-ink")}>{lessonLabel(l.title, mp.module.title, li, mp.module.lessons.length)}</span>
                        </Link>
                      </li>
                    );
                  })}
                  {mp.module.assignments.map((a) => {
                    const st = assignmentState(a, state.submissions.get(a.id));
                    return (
                      <li key={a.id}>
                        <Link href={`/homework/${a.id}`} className="flex items-center gap-2.5 rounded-lg py-1 text-[15px] hover:text-cobalt">
                          {st.status === "accepted" ? (
                            <CheckCircle2 className="size-[18px] shrink-0 text-st-accepted" aria-label="Принято" />
                          ) : (
                            <Circle className="size-[18px] shrink-0 text-line-strong" aria-label="Не принято" />
                          )}
                          <ClipboardList className="size-4 shrink-0 text-muted" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-ink">{a.title}</span>
                          <StatusBadge status={st.status} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {mp.surveyAvailable ? (
                  <Link href={`/survey/${mp.module.id}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-mark px-3 py-1.5 text-sm font-medium text-black">
                    <Sparkles className="size-4" aria-hidden /> Оценить модуль
                  </Link>
                ) : mp.surveyDone ? (
                  <p className="mt-3 text-sm text-muted">Модуль оценён — спасибо!</p>
                ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
