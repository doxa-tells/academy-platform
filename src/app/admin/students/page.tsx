import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Avatar, Badge, Card, EmptyState, Field, Input, PageHeader, SectionTitle, Select } from "@/components/ui";
import { cohortLabel, getCohorts } from "@/lib/cohorts";
import type { User } from "@/lib/db/schema";

function CohortSelect({ id, defaultValue, options }: { id: string; defaultValue: number; options: number[] }) {
  const max = Math.max(...options);
  return (
    <Field label="Поток" htmlFor={id} hint="Видео уроков и сроки у каждого потока свои">
      <Select id={id} name="cohort" defaultValue={String(defaultValue)}>
        {options.map((n) => (
          <option key={n} value={n}>
            {cohortLabel(n)}
          </option>
        ))}
        <option value={max + 1}>{cohortLabel(max + 1)} — новый</option>
      </Select>
    </Field>
  );
}
import { createStudent, resetPassword, setStudentActive, updateStudent } from "../actions";

export const metadata = { title: "Студенты" };

export default async function StudentsPage() {
  const [students, cohorts] = await Promise.all([
    db.select().from(schema.users).where(eq(schema.users.role, "student")).orderBy(asc(schema.users.createdAt)),
    getCohorts(),
  ]);
  const latest = Math.max(...cohorts);
  const groups = cohorts
    .slice()
    .reverse()
    .map((n) => ({ cohort: n, list: students.filter((s) => s.cohort === n) }))
    .filter((g) => g.list.length > 0);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Студенты" subtitle="Аккаунты создаёшь ты — студент получает логин и пароль" />

      <section>
        <SectionTitle>Добавить студента</SectionTitle>
        <Card className="p-4 sm:p-5">
          <ActionForm action={createStudent} submitLabel="Создать аккаунт" testId="new-student-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Имя" htmlFor="new-name">
                <Input id="new-name" name="name" required maxLength={100} placeholder="Айгерим Садыкова" />
              </Field>
              <Field label="Логин" htmlFor="new-login" hint="Латиница, цифры, точка или дефис">
                <Input id="new-login" name="login" required maxLength={40} autoCapitalize="none" placeholder="aigerim" />
              </Field>
              <CohortSelect id="new-cohort" defaultValue={latest} options={cohorts} />
            </div>
          </ActionForm>
        </Card>
      </section>

      {students.length === 0 ? (
        <section>
          <SectionTitle>Все студенты</SectionTitle>
          <EmptyState title="Пока никого" text="Создай аккаунт выше и передай логин с паролем студенту." />
        </section>
      ) : (
        groups.map((g) => (
          <section key={g.cohort} data-testid={`cohort-${g.cohort}`}>
            <SectionTitle>
              {cohortLabel(g.cohort)} · {g.list.length}
            </SectionTitle>
            <div className="space-y-3">
              {g.list.map((s) => (
                <StudentCard key={s.id} s={s} cohorts={cohorts} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function StudentCard({ s, cohorts }: { s: User; cohorts: number[] }) {
  return (
    <Card className="p-4 sm:p-5" data-testid="student-card">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={s.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{s.name}</p>
          <p className="text-sm text-ink-2">
            {s.login} · заходил {timeAgo(s.lastSeenAt)}
          </p>
        </div>
        {s.telegramChatId ? <Badge tone="success">Telegram ✓</Badge> : <Badge>Без Telegram</Badge>}
        {!s.active ? <Badge tone="danger">Отключён</Badge> : null}
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-cobalt">Управление</summary>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <ActionForm action={updateStudent} submitLabel="Сохранить" resetOnSuccess={false}>
            <input type="hidden" name="userId" value={s.id} />
            <Field label="Имя" htmlFor={`name-${s.id}`}>
              <Input id={`name-${s.id}`} name="name" defaultValue={s.name} required />
            </Field>
            <Field label="Логин" htmlFor={`login-${s.id}`}>
              <Input id={`login-${s.id}`} name="login" defaultValue={s.login} required />
            </Field>
            <CohortSelect id={`cohort-${s.id}`} defaultValue={s.cohort} options={cohorts} />
          </ActionForm>
          <div className="space-y-5">
            <ActionForm action={resetPassword} submitLabel="Сбросить пароль" resetOnSuccess={false}>
              <input type="hidden" name="userId" value={s.id} />
              <p className="text-sm text-ink-2">Создам новый пароль и покажу его один раз. Старый перестанет работать.</p>
            </ActionForm>
            <form action={setStudentActive.bind(null, s.id, !s.active)}>
              <button type="submit" className="text-sm font-medium text-st-revision hover:underline">
                {s.active ? "Отключить доступ" : "Вернуть доступ"}
              </button>
            </form>
          </div>
        </div>
      </details>
    </Card>
  );
}
