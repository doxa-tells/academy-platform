import Link from "next/link";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { computeProgress, getCourseTree, getStudentState } from "@/lib/course";
import { EmptyState, PageHeader, ProgressBar } from "@/components/ui";

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
        <div className="space-y-8">
          {withLessons.map((mp) => (
            <section key={mp.module.id}>
              <div className="mb-3 flex items-end justify-between gap-4">
                <h2 className="text-[17px] font-semibold text-ink">{mp.module.title}</h2>
                <span className="shrink-0 text-sm tabular-nums text-ink-2">
                  {mp.lessonsDone}/{mp.module.lessons.length}
                </span>
              </div>
              <ProgressBar value={mp.module.lessons.length ? (mp.lessonsDone / mp.module.lessons.length) * 100 : 0} className="mb-3" />
              <ol className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
                {mp.module.lessons.map((l, i) => {
                  const done = state.completed.has(l.id);
                  return (
                    <li key={l.id}>
                      <Link href={`/lessons/${l.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-paper">
                        <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{l.title}</span>
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
          ))}
        </div>
      )}
    </div>
  );
}
