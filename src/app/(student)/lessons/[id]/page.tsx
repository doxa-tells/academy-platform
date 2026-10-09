import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { assignmentState, getCourseTree, getStudentState } from "@/lib/course";
import { VideoEmbed } from "@/components/video-embed";
import { Markdown } from "@/components/markdown";
import { LessonDoneButton } from "@/components/lesson-done-button";
import { StatusBadge } from "@/components/ui";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStudent();
  const [tree, state] = await Promise.all([getCourseTree(), getStudentState(user.id)]);
  const all = tree.flatMap((m) => m.lessons.map((l) => ({ l, m })));
  const idx = all.findIndex((x) => x.l.id === id);
  if (idx === -1) notFound();
  const { l: lesson, m: mod } = all[idx];
  const prev = all[idx - 1]?.l;
  const next = all[idx + 1]?.l;
  const tasks = mod.assignments.filter((a) => a.lessonId === lesson.id);

  return (
    <article className="space-y-6">
      <div>
        <Link href="/lessons" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> {mod.title}
        </Link>
        <h1 className="mt-2 font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink sm:text-[26px]">{lesson.title}</h1>
      </div>

      <VideoEmbed url={lesson.videoUrl} title={lesson.title} />

      <div className="flex flex-wrap items-center gap-3">
        <LessonDoneButton lessonId={lesson.id} done={state.completed.has(lesson.id)} />
      </div>

      <Markdown>{lesson.description}</Markdown>

      {tasks.length > 0 ? (
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <p className="mb-2 text-sm font-medium text-ink-2">Задание к уроку</p>
          <ul className="space-y-2">
            {tasks.map((a) => (
              <li key={a.id}>
                <Link href={`/homework/${a.id}`} className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-paper">
                  <ClipboardList className="size-5 shrink-0 text-cobalt" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{a.title}</span>
                  <StatusBadge status={assignmentState(a, state.submissions.get(a.id)).status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="flex justify-between gap-3 border-t border-line pt-5" aria-label="Соседние уроки">
        {prev ? (
          <Link href={`/lessons/${prev.id}`} className="flex min-w-0 items-center gap-2 text-sm text-ink-2 hover:text-ink">
            <ArrowLeft className="size-4 shrink-0" aria-hidden /> <span className="truncate">{prev.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/lessons/${next.id}`} className="flex min-w-0 items-center gap-2 text-right text-sm font-medium text-cobalt hover:underline">
            <span className="truncate">{next.title}</span> <ArrowRight className="size-4 shrink-0" aria-hidden />
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
