import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db, schema } from "@/lib/db";
import { ActionForm, ConfirmButton } from "@/components/action-form";
import { ModuleFields } from "@/components/course-fields";
import { Card, PageHeader } from "@/components/ui";
import { deleteModule, updateModule } from "../../../actions";

export default async function EditModule({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = await db.query.modules.findFirst({ where: eq(schema.modules.id, id) });
  if (!mod) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/course" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Курс
      </Link>
      <PageHeader title="Модуль" />
      <Card className="p-5">
        <ActionForm action={updateModule} submitLabel="Сохранить" resetOnSuccess={false}>
          <ModuleFields mod={mod} />
        </ActionForm>
      </Card>
      <div className="mt-6 flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-st-revision/30 p-4">
        <p className="text-sm text-ink-2">Удаление модуля удалит его уроки, задания и сданные по ним работы.</p>
        <ConfirmButton action={deleteModule.bind(null, mod.id)} label="Удалить модуль" />
      </div>
    </div>
  );
}
