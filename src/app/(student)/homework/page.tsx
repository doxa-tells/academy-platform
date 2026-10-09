import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { assignmentState, getCourseTree, getStudentState } from "@/lib/course";
import { deadlineLabel, formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader, StatusBadge, cn } from "@/components/ui";

export const metadata = { title: "Домашки" };

export default async function HomeworkList() {
  const user = await requireStudent();
  const [tree, state] = await Promise.all([getCourseTree(), getStudentState(user.id)]);
  const now = new Date();
  const modules = tree.filter((m) => m.assignments.length > 0);

  return (
    <div>
      <PageHeader title="Домашние задания" subtitle="Загружай фото и видео — разбор придёт сюда и в Telegram" />
      {modules.length === 0 ? (
        <EmptyState title="Заданий пока нет" text="Как только преподаватель добавит задание, оно появится здесь." />
      ) : (
        <div className="space-y-8">
          {modules.map((m) => (
            <section key={m.id}>
              <h2 className="mb-3 text-[17px] font-semibold text-ink">{m.title}</h2>
              <ul className="space-y-2">
                {m.assignments.map((a) => {
                  const st = assignmentState(a, state.submissions.get(a.id), now);
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/homework/${a.id}`}
                        className={cn(
                          "flex items-center gap-3 rounded-[var(--radius-card)] border bg-surface px-4 py-3.5 hover:border-line-strong",
                          st.status === "revision" || st.overdue ? "border-st-revision/30" : "border-line",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-ink">{a.title}</p>
                          {a.dueAt ? (
                            <p className={cn("mt-0.5 text-sm", st.overdue ? "text-st-revision" : "text-ink-2")}>
                              Срок: {formatDateTime(a.dueAt)}
                              {st.needsAction ? ` · ${deadlineLabel(a.dueAt, now)}` : ""}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-sm text-muted">Без срока</p>
                          )}
                        </div>
                        <StatusBadge status={st.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
