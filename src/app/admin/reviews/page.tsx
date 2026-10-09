import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Clock, Paperclip } from "lucide-react";
import { db, schema } from "@/lib/db";
import { getReviewQueue } from "@/lib/review-queue";
import { timeAgo } from "@/lib/format";
import type { SubmissionStatus } from "@/lib/db/schema";
import { Avatar, EmptyState, PageHeader, StatusBadge, cn } from "@/components/ui";

export const metadata = { title: "Домашки" };

const TABS: { key: string; label: string; statuses: SubmissionStatus[] | null }[] = [
  { key: "new", label: "Ждут проверки", statuses: ["submitted", "in_review"] },
  { key: "revision", label: "На доработке", statuses: ["revision"] },
  { key: "accepted", label: "Принято", statuses: ["accepted"] },
  { key: "all", label: "Все", statuses: null },
];

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ tab?: string; student?: string }> }) {
  const { tab = "new", student } = await searchParams;
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];
  const [rows, students] = await Promise.all([
    getReviewQueue(current.statuses, student || undefined),
    db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(eq(schema.users.role, "student")).orderBy(asc(schema.users.createdAt)),
  ]);
  const studentName = students.find((s) => s.id === student)?.name;
  const qs = (t: string, s?: string) => `/admin/reviews?tab=${t}${s ? `&student=${s}` : ""}`;

  return (
    <div>
      <PageHeader title="Домашки" subtitle={studentName ? `Работы студента: ${studentName}` : "Очередь проверки"} />
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-[var(--radius-control)] bg-surface p-1 ring-1 ring-line" role="tablist">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={qs(t.key, student)}
            role="tab"
            aria-selected={t.key === current.key}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium",
              t.key === current.key ? "bg-cobalt text-white" : "text-ink-2 hover:bg-ink/5",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {students.length > 1 ? (
        <div className="mb-5 flex flex-wrap gap-2 text-sm">
          <Link href={qs(current.key)} className={cn("rounded-full px-3 py-1", !student ? "bg-ink text-white" : "bg-surface text-ink-2 ring-1 ring-line")}>
            Все студенты
          </Link>
          {students.map((s) => (
            <Link key={s.id} href={qs(current.key, s.id)} className={cn("rounded-full px-3 py-1", student === s.id ? "bg-ink text-white" : "bg-surface text-ink-2 ring-1 ring-line")}>
              {s.name}
            </Link>
          ))}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title={current.key === "new" ? "Новых работ нет" : "Здесь пусто"} text="Когда студент отправит работу, она появится в этой очереди, а тебе придёт сообщение в Telegram." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface" data-testid="review-list">
          {rows.map((r) => (
            <li key={r.submission.id}>
              <Link href={`/admin/reviews/${r.submission.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-paper">
                <Avatar name={r.student.name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{r.assignment.title}</p>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-ink-2">
                    {r.student.name}
                    <span aria-hidden>·</span>
                    <Clock className="size-3.5" aria-hidden /> {timeAgo(r.submission.lastAttemptAt)}
                    {r.files ? (
                      <>
                        <span aria-hidden>·</span>
                        <Paperclip className="size-3.5" aria-hidden /> {r.files}
                      </>
                    ) : null}
                  </p>
                </div>
                <StatusBadge status={r.submission.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
