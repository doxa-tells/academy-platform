import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { db, schema } from "@/lib/db";
import { getThread } from "@/lib/homework";
import { formatDateTime } from "@/lib/format";
import { Markdown } from "@/components/markdown";
import { Thread } from "@/components/thread";
import { FeedbackPanel } from "@/components/feedback-panel";
import { Avatar, StatusBadge } from "@/components/ui";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let submission = await db.query.submissions.findFirst({ where: eq(schema.submissions.id, id) });
  if (!submission) notFound();

  // Opening a fresh submission moves it to "На проверке" so the student sees it is being looked at.
  if (submission.status === "submitted") {
    [submission] = await db
      .update(schema.submissions)
      .set({ status: "in_review", updatedAt: new Date() })
      .where(eq(schema.submissions.id, id))
      .returning();
  }

  const [student, assignment, thread] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.id, submission.studentId) }),
    db.query.assignments.findFirst({ where: eq(schema.assignments.id, submission.assignmentId) }),
    getThread(submission.id),
  ]);
  if (!student || !assignment) notFound();

  const images = thread
    .filter((t) => t.entry.kind === "attempt")
    .flatMap((t) => t.attachments.filter((a) => a.kind === "image").map((a) => ({ url: a.url, name: a.name })))
    .reverse();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/reviews" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Очередь
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Avatar name={student.name} size={40} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[20px] font-semibold leading-tight text-ink sm:text-[24px]">{assignment.title}</h1>
            <p className="text-sm text-ink-2">{student.name}</p>
          </div>
          <StatusBadge status={submission.status} />
        </div>
        {assignment.dueAt ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-2">
            <CalendarClock className="size-4" aria-hidden /> Срок: {formatDateTime(assignment.dueAt)}
          </p>
        ) : null}
      </div>

      {assignment.description ? (
        <details className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium text-ink-2">Текст задания</summary>
          <div className="mt-3">
            <Markdown>{assignment.description}</Markdown>
          </div>
        </details>
      ) : null}

      <Thread entries={thread} viewerRole="admin" />

      <FeedbackPanel submissionId={submission.id} images={images} status={submission.status} />
    </div>
  );
}
