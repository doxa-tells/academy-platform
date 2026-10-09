import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db, schema } from "@/lib/db";
import { ActionForm, ConfirmButton } from "@/components/action-form";
import { LessonFields } from "@/components/course-fields";
import { VideoEmbed } from "@/components/video-embed";
import { Card, PageHeader } from "@/components/ui";
import { deleteLesson, updateLesson } from "../../../actions";

export default async function EditLesson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await db.query.lessons.findFirst({ where: eq(schema.lessons.id, id) });
  if (!lesson) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin/course" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Курс
        </Link>
        <PageHeader title="Урок" />
      </div>
      <VideoEmbed url={lesson.videoUrl} title={lesson.title} />
      <Card className="p-5">
        <ActionForm action={updateLesson} submitLabel="Сохранить урок" resetOnSuccess={false}>
          <LessonFields lesson={lesson} />
        </ActionForm>
      </Card>
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-st-revision/30 p-4">
        <p className="text-sm text-ink-2">Отметки «пройдено» по этому уроку тоже удалятся.</p>
        <ConfirmButton action={deleteLesson.bind(null, lesson.id)} label="Удалить урок" />
      </div>
    </div>
  );
}
