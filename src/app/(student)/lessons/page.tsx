import Link from "next/link";
import { CheckCircle2, PlayCircle } from "@/components/icons";
import { requireStudent } from "@/lib/auth";
import { computeProgress, getCourseTree, getStudentState } from "@/lib/course";
import { EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { lessonLabel } from "@/lib/format";
import { LessonArt } from "@/components/lesson-art";

export const metadata = { title: "Уроки" };

export default async function LessonsPage() {
  const user = await requireStudent();
  const [tree, state] = await Promise.all([getCourseTree(), getStudentState(user.id)]);
  const progress = computeProgress(tree, state);
  const withLessons = progress.modules.filter((m) => m.module.lessons.length > 0);

  return (
    <div>
      <PageHeader title="Видео-уроки" subtitle="Смотри по порядку и отмечай пройденное" />
      {withLessons.length === 0 ? (
        <EmptyState title="Уроков пока нет" text="Преподаватель скоро их добавит." />
      ) : (
        <div className="space-y-6">
          {withLessons.map((mp) => {
            const idx = progress.modules.indexOf(mp);
            const total = mp.module.lessons.length;
            return (
              <section key={mp.module.id} className="border border-line bg-surface p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <LessonArt title={mp.module.title} index={idx} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[16px] font-semibold leading-snug text-ink">{mp.module.title}</h2>
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={total ? (mp.lessonsDone / total) * 100 : 0} />
                      <span className="shrink-0 text-sm tabular-nums text-ink-2">
                        {mp.lessonsDone}/{total}
                      </span>
                    </div>
                  </div>
                </div>
                <ol className="mt-4 divide-y divide-line border border-line bg-black/40">
                  {mp.module.lessons.map((l, i) => {
                    const done = state.completed.has(l.id);
                    return (
                      <li key={l.id}>
                        <Link href={`/lessons/${l.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
                          <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{i + 1}</span>
                          <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{lessonLabel(l.title, mp.module.title, i, total)}</span>
                          {done ? (
                            <CheckCircle2 className="size-5 shrink-0 text-st-accepted" aria-label="Пройден" />
                          ) : (
                            <PlayCircle className="size-5 shrink-0 text-cobalt" aria-label="Не пройден" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
