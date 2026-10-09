import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, CalendarClock, PartyPopper, PlayCircle } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { assignmentState } from "@/lib/course";
import { getThread } from "@/lib/homework";
import { deadlineLabel, formatDateTime } from "@/lib/format";
import { Markdown } from "@/components/markdown";
import { Thread } from "@/components/thread";
import { HomeworkForm } from "@/components/homework-form";
import { Notice, StatusBadge, cn } from "@/components/ui";

const STATUS_HINT = {
  todo: null,
  submitted: "Работа отправлена и ждёт проверки. Можно дополнить её, если что-то забыл.",
  in_review: "Преподаватель смотрит работу прямо сейчас.",
  revision: "Посмотри комментарии ниже, поправь и отправь доработку.",
  accepted: null,
} as const;

export default async function HomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStudent();
  const assignment = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, id) });
  if (!assignment) notFound();
  const [mod, lesson, submission] = await Promise.all([
    db.query.modules.findFirst({ where: eq(schema.modules.id, assignment.moduleId) }),
    assignment.lessonId ? db.query.lessons.findFirst({ where: eq(schema.lessons.id, assignment.lessonId) }) : null,
    db.query.submissions.findFirst({
      where: and(eq(schema.submissions.assignmentId, id), eq(schema.submissions.studentId, user.id)),
    }),
  ]);
  const thread = submission ? await getThread(submission.id) : [];
  const st = assignmentState(assignment, submission ?? undefined);
  const hint = STATUS_HINT[st.status];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/homework" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> {mod?.title ?? "Домашки"}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink sm:text-[26px]">{assignment.title}</h1>
          <StatusBadge status={st.status} className="mt-1" />
        </div>
        {assignment.dueAt ? (
          <p className={cn("mt-2 flex items-center gap-1.5 text-sm", st.overdue ? "text-st-revision" : "text-ink-2")}>
            <CalendarClock className="size-4" aria-hidden />
            Срок: {formatDateTime(assignment.dueAt)}
            {st.needsAction ? ` · ${deadlineLabel(assignment.dueAt)}` : ""}
          </p>
        ) : null}
      </div>

      {assignment.description ? (
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5">
          <Markdown>{assignment.description}</Markdown>
          {lesson ? (
            <Link href={`/lessons/${lesson.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-cobalt hover:underline">
              <PlayCircle className="size-4" aria-hidden /> Урок: {lesson.title}
            </Link>
          ) : null}
        </div>
      ) : null}

      {hint ? <Notice tone={st.status === "revision" ? "error" : "info"}>{hint}</Notice> : null}

      {st.status === "accepted" ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] bg-st-accepted-bg px-5 py-4 text-st-accepted">
          <PartyPopper className="size-6 shrink-0" aria-hidden />
          <p className="font-medium">Работа принята. Отличная работа!</p>
        </div>
      ) : null}

      <Thread entries={thread} viewerRole="student" />

      {st.status !== "accepted" ? <HomeworkForm assignmentId={assignment.id} isRevision={st.status === "revision"} /> : null}
    </div>
  );
}
