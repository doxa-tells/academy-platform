import Link from "next/link";
import { ArrowRight, BellRing, CalendarClock, MessageCircleWarning, Sparkles } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { assignmentState, computeProgress, getCourseTree, getPostsForStudent, getStudentState } from "@/lib/course";
import { getBotUsername } from "@/lib/telegram";
import { deadlineLabel, formatDateTime } from "@/lib/format";
import { Card, LinkButton, ProgressRing, SectionTitle, StatusBadge, cn } from "@/components/ui";

export default async function StudentHome() {
  const user = await requireStudent();
  const [tree, state, posts, botUsername] = await Promise.all([
    getCourseTree(),
    getStudentState(user.id),
    getPostsForStudent(user.id),
    getBotUsername(),
  ]);
  const progress = computeProgress(tree, state);
  const now = new Date();

  const assignments = tree.flatMap((m) => m.assignments.map((a) => ({ a, m })));
  const withState = assignments.map(({ a, m }) => ({ a, m, st: assignmentState(a, state.submissions.get(a.id), now) }));
  const revision = withState.filter((x) => x.st.status === "revision");
  const overdue = withState.filter((x) => x.st.overdue && x.st.status !== "revision");
  const upcoming = withState
    .filter((x) => x.st.needsAction && !x.st.overdue && x.a.dueAt)
    .sort((a, b) => a.a.dueAt!.getTime() - b.a.dueAt!.getTime())
    .slice(0, 3);
  const surveys = progress.modules.filter((m) => m.surveyAvailable);

  // Next step: first lesson not completed, otherwise first assignment needing action
  const nextLesson = tree.flatMap((m) => m.lessons).find((l) => !state.completed.has(l.id));
  const nextTask = withState.find((x) => x.st.status === "todo");

  const unreadPosts = posts.filter((p) => !p.readAt).slice(0, 3);
  const firstName = user.name.split(/\s+/)[0];

  return (
    <div className="space-y-8">
      <div className="animate-rise">
        <p className="text-[15px] text-ink-2">Привет, {firstName}</p>
        <h1 className="mt-1 font-display text-[24px] font-semibold leading-tight tracking-[-0.01em] text-ink sm:text-[28px]">
          {progress.percent === 100 ? "Курс пройден целиком" : "Продолжим с того места, где остановились"}
        </h1>
      </div>

      <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <ProgressRing value={progress.percent} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-ink">
            Пройдено {progress.done} из {progress.total}
          </p>
          <p className="mt-0.5 text-sm text-ink-2">Уроки отмечаются просмотренными, задания засчитываются после «Принято».</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {nextLesson ? (
            <LinkButton href={`/lessons/${nextLesson.id}`}>
              Следующий урок <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
          ) : nextTask ? (
            <LinkButton href={`/homework/${nextTask.a.id}`}>
              К заданию <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
          ) : null}
          <LinkButton href="/progress" variant="secondary">
            Карта
          </LinkButton>
        </div>
      </Card>

      {surveys.map((s) => (
        <Link
          key={s.module.id}
          href={`/survey/${s.module.id}`}
          className="flex items-center gap-4 rounded-[var(--radius-card)] bg-mark px-5 py-4 text-ink transition-transform hover:-translate-y-0.5"
        >
          <Sparkles className="size-6 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Оцени модуль «{s.module.title}»</p>
            <p className="text-sm">Две минуты: оценка и что улучшить. Это помогает сделать курс лучше.</p>
          </div>
          <ArrowRight className="size-5 shrink-0" aria-hidden />
        </Link>
      ))}

      {revision.length + overdue.length + upcoming.length > 0 ? (
        <section>
          <SectionTitle>Задания</SectionTitle>
          <ul className="space-y-2">
            {revision.map(({ a, m }) => (
              <TaskRow key={a.id} href={`/homework/${a.id}`} title={a.title} sub={`Нужна доработка · ${m.title}`} tone="revision">
                <StatusBadge status="revision" />
              </TaskRow>
            ))}
            {overdue.map(({ a, m }) => (
              <TaskRow key={a.id} href={`/homework/${a.id}`} title={a.title} sub={`${deadlineLabel(a.dueAt, now)} · ${m.title}`} tone="revision">
                <MessageCircleWarning className="size-5 text-st-revision" aria-label="Просрочено" />
              </TaskRow>
            ))}
            {upcoming.map(({ a, st }) => (
              <TaskRow
                key={a.id}
                href={`/homework/${a.id}`}
                title={a.title}
                sub={`Срок ${formatDateTime(a.dueAt)} · ${deadlineLabel(a.dueAt, now)}`}
                tone="normal"
              >
                <StatusBadge status={st.status} />
              </TaskRow>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <SectionTitle
          action={
            <Link href="/board" className="text-sm font-medium text-cobalt hover:underline">
              Вся доска
            </Link>
          }
        >
          Новое на доске
        </SectionTitle>
        {unreadPosts.length === 0 ? (
          <p className="text-[15px] text-ink-2">Все посты прочитаны.</p>
        ) : (
          <ul className="space-y-2">
            {unreadPosts.map(({ post }) => (
              <li key={post.id}>
                <Link href={`/board#post-${post.id}`} className="block rounded-[var(--radius-card)] border border-line bg-surface px-4 py-3 hover:border-line-strong">
                  <p className="font-medium text-ink">
                    <span className="mark">{post.title}</span>
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-ink-2">{post.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!user.telegramChatId && botUsername ? (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <BellRing className="size-6 shrink-0 text-cobalt" aria-hidden />
          <div className="flex-1">
            <p className="font-medium text-ink">Подключи уведомления в Telegram</p>
            <p className="text-sm text-ink-2">Сообщу о разборе домашки, новых постах и дедлайнах.</p>
          </div>
          <LinkButton href="/profile" variant="secondary">
            Подключить
          </LinkButton>
        </Card>
      ) : null}
    </div>
  );
}

function TaskRow({
  href,
  title,
  sub,
  tone,
  children,
}: {
  href: string;
  title: string;
  sub: string;
  tone: "revision" | "normal";
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-card)] border bg-surface px-4 py-3 hover:border-line-strong",
          tone === "revision" ? "border-st-revision/30" : "border-line",
        )}
      >
        <CalendarClock className="size-5 shrink-0 text-muted" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{title}</p>
          <p className="truncate text-sm text-ink-2">{sub}</p>
        </div>
        {children}
      </Link>
    </li>
  );
}
