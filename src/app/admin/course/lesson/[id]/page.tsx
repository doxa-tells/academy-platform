import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "@/components/icons";
import { db, schema } from "@/lib/db";
import { cohortLabel, getCohortOverrides, getCohorts, videoFor } from "@/lib/cohorts";
import { ActionForm, ConfirmButton } from "@/components/action-form";
import { LessonFields } from "@/components/course-fields";
import { VideoEmbed } from "@/components/video-embed";
import { Card, PageHeader } from "@/components/ui";
import { deleteLesson, updateLesson } from "../../../actions";

export default async function EditLesson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lesson, cohorts, ov] = await Promise.all([
    db.query.lessons.findFirst({ where: eq(schema.lessons.id, id) }),
    getCohorts(),
    getCohortOverrides(),
  ]);
  if (!lesson) notFound();
  const videos = Object.fromEntries(cohorts.filter((n) => n > 1).map((n) => [n, videoFor(lesson, n, ov)]));
  const withVideo = cohorts.filter((n) => videoFor(lesson, n, ov));
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin/course" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Курс
        </Link>
        <PageHeader title="Урок" />
      </div>
      {cohorts.length <= 1 ? (
        <VideoEmbed url={lesson.videoUrl} title={lesson.title} />
      ) : (
        <div className="space-y-4">
          {withVideo.length === 0 ? <VideoEmbed url="" title={lesson.title} /> : null}
          {withVideo.map((n) => (
            <div key={n} className="space-y-2">
              <p className="text-sm font-medium text-ink-2">{cohortLabel(n)}</p>
              <VideoEmbed url={videoFor(lesson, n, ov)} title={`${lesson.title} — ${cohortLabel(n)}`} />
            </div>
          ))}
        </div>
      )}
      <Card className="p-5">
        <ActionForm action={updateLesson} submitLabel="Сохранить урок" resetOnSuccess={false}>
          <LessonFields lesson={lesson} cohorts={cohorts} videos={videos} />
        </ActionForm>
      </Card>
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-st-revision/30 p-4">
        <p className="text-sm text-ink-2">Отметки «пройдено» по этому уроку тоже удалятся.</p>
        <ConfirmButton action={deleteLesson.bind(null, lesson.id)} label="Удалить урок" />
      </div>
    </div>
  );
}
