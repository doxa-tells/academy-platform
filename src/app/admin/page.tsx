import Link from "next/link";
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Clock, Inbox, Send, Settings } from "lucide-react";
import { getStudentReports } from "@/lib/course";
import { getReviewQueue } from "@/lib/review-queue";
import { timeAgo } from "@/lib/format";
import { Avatar, Badge, Card, EmptyState, LinkButton, PageHeader, ProgressBar, SectionTitle, StatusBadge, cn } from "@/components/ui";

export const metadata = { title: "Сводка" };

const riskBadge = {
  high: <Badge tone="danger">Отстаёт</Badge>,
  medium: <Badge tone="warn">Нужно внимание</Badge>,
  ok: <Badge tone="success">В порядке</Badge>,
} as const;

export default async function AdminDashboard() {
  const [reports, queue] = await Promise.all([getStudentReports(), getReviewQueue(["submitted", "in_review"], undefined, 6)]);
  const atRisk = reports.filter((r) => r.risk !== "ok").length;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Сводка"
        subtitle={
          reports.length === 0
            ? "Добавь студентов, чтобы видеть их прогресс"
            : atRisk === 0
              ? "Все студенты в ритме — никого не нужно догонять"
              : `Внимания требуют ${atRisk} из ${reports.length}`
        }
      />

      <section>
        <SectionTitle>Кто отстаёт</SectionTitle>
        {reports.length === 0 ? (
          <EmptyState title="Студентов пока нет" action={<LinkButton href="/admin/students">Добавить студента</LinkButton>} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2" data-testid="risk-list">
            {reports.map((r) => (
              <Card
                key={r.student.id}
                className={cn("p-5", r.risk === "high" && "border-st-revision/40", r.risk === "medium" && "border-st-review/40")}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={r.student.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[16px] font-semibold text-ink">{r.student.name}</p>
                      {riskBadge[r.risk]}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-2">
                      {r.student.lastSeenAt ? `Был на платформе ${timeAgo(r.student.lastSeenAt)}` : "Ещё не заходил на платформу"}
                      {r.student.telegramChatId ? "" : " · Telegram не подключён"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <ProgressBar value={r.percent} />
                  <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-ink">{r.percent}%</span>
                </div>

                <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <Stat label="просрочено" value={r.overdue.length} alert={r.overdue.length > 0} />
                  <Stat label="доработка" value={r.revision} alert={r.revision > 0} />
                  <Stat label="не прочитал" value={r.unread} alert={r.unread >= 3} />
                  <Stat label="оценка" value={r.lastScore ?? "—"} alert={r.lastScore !== null && r.lastScore <= 6} />
                </dl>

                {r.reasons.length > 0 ? (
                  <ul className="mt-4 space-y-1 text-sm text-ink">
                    {r.reasons.map((reason) => (
                      <li key={reason} className="flex items-center gap-2">
                        <AlertTriangle className="size-4 shrink-0 text-st-review" aria-hidden /> {reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 flex items-center gap-2 text-sm text-st-accepted">
                    <CheckCircle2 className="size-4" aria-hidden /> Всё в ритме
                  </p>
                )}
                {r.overdue.length > 0 ? (
                  <p className="mt-2 text-sm text-ink-2">Просрочено: {r.overdue.map((o) => o.assignment.title).join(", ")}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {r.student.telegramUsername ? (
                    <a href={`https://t.me/${r.student.telegramUsername}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cobalt px-3 text-sm font-medium text-white hover:bg-cobalt-dark">
                      <Send className="size-3.5" aria-hidden /> Написать
                    </a>
                  ) : null}
                  <LinkButton href={`/admin/reviews?student=${r.student.id}&tab=all`} variant="secondary" size="sm">
                    Работы студента
                  </LinkButton>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle
          action={
            <Link href="/admin/reviews" className="text-sm font-medium text-cobalt hover:underline">
              Вся очередь
            </Link>
          }
        >
          Ждут проверки
        </SectionTitle>
        {queue.length === 0 ? (
          <p className="flex items-center gap-2 text-[15px] text-ink-2">
            <Inbox className="size-5 text-muted" aria-hidden /> Новых работ нет.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {queue.map((q) => (
              <li key={q.submission.id}>
                <Link href={`/admin/reviews/${q.submission.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
                  <Avatar name={q.student.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{q.assignment.title}</p>
                    <p className="flex items-center gap-1.5 text-sm text-ink-2">
                      {q.student.name} <span aria-hidden>·</span> <Clock className="size-3.5" aria-hidden /> {timeAgo(q.submission.lastAttemptAt)}
                    </p>
                  </div>
                  <StatusBadge status={q.submission.status} />
                  <ArrowRight className="hidden size-4 text-muted sm:block" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-2 sm:grid-cols-2 md:hidden">
        <LinkButton href="/admin/surveys" variant="secondary">
          <BarChart3 className="size-4" aria-hidden /> Опросы
        </LinkButton>
        <LinkButton href="/admin/settings" variant="secondary">
          <Settings className="size-4" aria-hidden /> Настройки и Telegram
        </LinkButton>
      </section>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: number | string; alert?: boolean }) {
  return (
    <div className={cn("rounded-lg px-1 py-2", alert ? "bg-st-revision-bg" : "bg-paper")}>
      <dd className={cn("text-[17px] font-semibold tabular-nums", alert ? "text-st-revision" : "text-ink")}>{value}</dd>
      <dt className="text-[11px] leading-tight text-ink-2">{label}</dt>
    </div>
  );
}
