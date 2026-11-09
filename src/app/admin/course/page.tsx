import Link from "next/link";
import { ArrowRight, ClipboardList, ExternalLink, Lock, Unlock } from "@/components/icons";
import { getCourseTree } from "@/lib/course";
import { cohortLabel, getAdminCohort } from "@/lib/cohorts";
import { formatShort, toLocalInputValue } from "@/lib/format";
import { InlineForm } from "@/components/inline-form";
import { Card, EmptyState, Input, LinkButton, PageHeader, cn } from "@/components/ui";
import { LessonArt } from "@/components/lesson-art";
import { saveCohortDeadline, saveCohortVideo, setLessonOpen, setSurveyOpen } from "../actions";

export const metadata = { title: "Курс" };

/** Курс так, как его видит выбранный поток: что открыто, какие записи, какие сроки. */
export default async function CoursePage() {
  const cohort = await getAdminCohort();
  const tree = await getCourseTree(cohort);
  const lessons = tree.flatMap((m) => m.lessons);
  const opened = lessons.filter((l) => !l.locked).length;
  const label = cohortLabel(cohort);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Курс"
        subtitle={`${label}: открыто уроков — ${opened} из ${lessons.length}. Открывай уроки по ходу занятий, вставляй записи и ставь сроки сдачи.`}
      />
      <Link href="/admin/program" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-cobalt">
        Названия, конспекты и тексты заданий общие — они в «Программе» <ArrowRight className="size-4" aria-hidden />
      </Link>

      {tree.length === 0 ? (
        <EmptyState title="Программа пуста" text="Сначала добавь модули и уроки." action={<LinkButton href="/admin/program">К программе</LinkButton>} />
      ) : null}

      {tree.map((m, mi) => (
        <Card key={m.id} className="overflow-hidden" data-testid="cohort-module">
          <div className="flex items-center gap-3 border-b border-line bg-paper/60 px-4 py-3">
            <LessonArt title={m.title} index={mi} size="sm" />
            <h2 className="min-w-0 flex-1 text-[16px] font-semibold leading-snug text-ink">{m.title}</h2>
          </div>

          <div className="divide-y divide-line">
            {m.lessons.map((l) => (
              <div key={l.id} className="space-y-3 px-4 py-4" data-testid="cohort-lesson">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  {l.locked ? (
                    <Lock className="size-5 shrink-0 text-muted" aria-hidden />
                  ) : (
                    <Unlock className="size-5 shrink-0 text-st-accepted" aria-hidden />
                  )}
                  <p className={cn("min-w-0 flex-1 text-[15px] font-medium", l.locked ? "text-ink-2" : "text-ink")}>{l.title}</p>
                  <span className={cn("text-xs", l.locked ? "text-muted" : "text-st-accepted")}>
                    {l.locked ? "закрыт" : `открыт ${formatShort(l.openedAt)}`}
                  </span>
                  <form action={setLessonOpen.bind(null, l.id, cohort, l.locked)}>
                    <button
                      type="submit"
                      className={cn(
                        "h-8 px-3 text-sm font-semibold",
                        l.locked ? "bg-cobalt text-black" : "text-ink-2 ring-1 ring-line-strong hover:text-ink",
                      )}
                    >
                      {l.locked ? "Открыть урок" : "Закрыть"}
                    </button>
                  </form>
                </div>
                <InlineForm action={saveCohortVideo} testId="cohort-video-form">
                  <input type="hidden" name="lessonId" value={l.id} />
                  <input type="hidden" name="cohort" value={cohort} />
                  <Input
                    name="videoUrl"
                    defaultValue={l.videoUrl}
                    inputMode="url"
                    placeholder="Ссылка на запись урока — YouTube, Vimeo, Google Drive…"
                    aria-label={`Запись урока «${l.title}» для потока ${cohort}`}
                    className="h-9 min-w-0 flex-1 basis-60"
                  />
                  {l.videoUrl ? (
                    <a href={l.videoUrl} target="_blank" rel="noopener noreferrer" className="text-ink-2 hover:text-cobalt" aria-label="Открыть запись">
                      <ExternalLink className="size-4" />
                    </a>
                  ) : null}
                </InlineForm>
              </div>
            ))}

            {m.assignments.map((a) => (
              <div key={a.id} className="space-y-2 px-4 py-4" data-testid="cohort-assignment">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <ClipboardList className="size-5 shrink-0 text-cobalt" aria-hidden />
                  <p className="min-w-0 flex-1 text-[15px] text-ink">{a.title}</p>
                  {a.locked ? <span className="text-xs text-muted">откроется вместе с уроком</span> : null}
                </div>
                <InlineForm action={saveCohortDeadline} testId="cohort-deadline-form">
                  <input type="hidden" name="assignmentId" value={a.id} />
                  <input type="hidden" name="cohort" value={cohort} />
                  <span className="text-sm text-ink-2">Срок сдачи</span>
                  <div className="w-60 max-w-full">
                    <Input
                      name="dueAt"
                      type="datetime-local"
                      defaultValue={toLocalInputValue(a.dueAt)}
                      aria-label={`Срок задания «${a.title}» для потока ${cohort}`}
                      className="h-9"
                    />
                  </div>
                </InlineForm>
              </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3 bg-paper px-4 py-3">
              <p className="text-sm text-ink-2">
                Опрос после модуля:{" "}
                <span className="font-medium text-ink">{m.surveyOpen ? "открыт для потока" : "откроется сам, когда студент пройдёт модуль"}</span>
              </p>
              <form action={setSurveyOpen.bind(null, m.id, cohort, !m.surveyOpen)}>
                <button type="submit" className="text-sm font-medium text-cobalt hover:underline">
                  {m.surveyOpen ? "Закрыть" : "Открыть сейчас"}
                </button>
              </form>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
