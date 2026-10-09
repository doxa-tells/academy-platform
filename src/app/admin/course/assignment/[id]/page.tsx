import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db, schema } from "@/lib/db";
import { ActionForm, ConfirmButton } from "@/components/action-form";
import { AssignmentFields } from "@/components/course-fields";
import { Card, PageHeader } from "@/components/ui";
import { deleteAssignment, updateAssignment } from "../../../actions";

export default async function EditAssignment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assignment = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, id) });
  if (!assignment) notFound();
  const lessons = await db.select().from(schema.lessons).where(eq(schema.lessons.moduleId, assignment.moduleId)).orderBy(asc(schema.lessons.position));
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin/course" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Курс
        </Link>
        <PageHeader title="Задание" />
      </div>
      <Card className="p-5">
        <ActionForm action={updateAssignment} submitLabel="Сохранить задание" resetOnSuccess={false}>
          <AssignmentFields assignment={assignment} lessons={lessons} />
        </ActionForm>
      </Card>
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-st-revision/30 p-4">
        <p className="text-sm text-ink-2">Вместе с заданием удалятся все сданные по нему работы.</p>
        <ConfirmButton action={deleteAssignment.bind(null, assignment.id)} label="Удалить задание" />
      </div>
    </div>
  );
}
