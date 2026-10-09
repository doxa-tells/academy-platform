import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { formatShort } from "@/lib/format";
import { Avatar, Card, EmptyState, PageHeader, cn } from "@/components/ui";
import { setSurveyOpen } from "../actions";

export const metadata = { title: "Опросы" };

function scoreTone(score: number) {
  return score <= 6 ? "bg-st-revision-bg text-st-revision" : score <= 8 ? "bg-st-review-bg text-st-review" : "bg-st-accepted-bg text-st-accepted";
}

export default async function SurveysPage() {
  const [mods, responses] = await Promise.all([
    db.select().from(schema.modules).orderBy(asc(schema.modules.position)),
    db
      .select({ r: schema.surveyResponses, name: schema.users.name })
      .from(schema.surveyResponses)
      .innerJoin(schema.users, eq(schema.users.id, schema.surveyResponses.studentId))
      .orderBy(desc(schema.surveyResponses.createdAt)),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Опросы после модулей"
        subtitle="Опрос открывается сам, когда студент проходит модуль. Низкие оценки (6 и ниже) приходят тебе в Telegram сразу."
      />
      {mods.length === 0 ? <EmptyState title="Модулей пока нет" /> : null}
      {mods.map((m) => {
        const list = responses.filter((x) => x.r.moduleId === m.id);
        const avg = list.length ? list.reduce((s, x) => s + x.r.score, 0) / list.length : null;
        return (
          <Card key={m.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-semibold text-ink">{m.title}</h2>
                <p className="mt-0.5 text-sm text-ink-2">
                  {list.length ? `Ответов: ${list.length} · средняя ${avg!.toFixed(1)}` : "Ответов пока нет"}
                </p>
              </div>
              <form action={setSurveyOpen.bind(null, m.id, !m.surveyOpen)}>
                <button type="submit" className="rounded-lg px-3 py-1.5 text-sm font-medium text-cobalt ring-1 ring-cobalt/30 hover:bg-cobalt-soft">
                  {m.surveyOpen ? "Закрыть опрос" : "Открыть для всех"}
                </button>
              </form>
            </div>
            {list.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {list.map(({ r, name }) => (
                  <li key={r.id} className="flex gap-3 rounded-xl bg-paper p-3">
                    <Avatar name={name} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">{name}</p>
                        <span className={cn("rounded-full px-2 py-0.5 text-sm font-semibold tabular-nums", scoreTone(r.score))}>{r.score}/10</span>
                        <span className="text-xs text-muted">{formatShort(r.createdAt)}</span>
                      </div>
                      {r.improve ? <p className="mt-1 whitespace-pre-wrap text-[15px] text-ink">{r.improve}</p> : <p className="mt-1 text-sm text-muted">Без комментария</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
