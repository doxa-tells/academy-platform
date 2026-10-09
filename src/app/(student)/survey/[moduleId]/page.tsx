import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireStudent } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { SurveyForm } from "@/components/survey-form";

export const metadata = { title: "Оценка модуля" };

export default async function SurveyPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const user = await requireStudent();
  const mod = await db.query.modules.findFirst({ where: eq(schema.modules.id, moduleId) });
  if (!mod) notFound();
  const existing = await db.query.surveyResponses.findFirst({
    where: and(eq(schema.surveyResponses.moduleId, moduleId), eq(schema.surveyResponses.studentId, user.id)),
  });
  return (
    <div className="max-w-xl">
      <PageHeader title={`Оценка: ${mod.title}`} subtitle="Ответ видит только преподаватель" />
      <SurveyForm moduleId={mod.id} initialScore={existing?.score} initialImprove={existing?.improve} />
    </div>
  );
}
