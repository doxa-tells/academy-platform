import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Avatar, Badge, Card, EmptyState, Field, Input, PageHeader, SectionTitle } from "@/components/ui";
import { createStudent, resetPassword, setStudentActive, updateStudent } from "../actions";

export const metadata = { title: "Студенты" };

export default async function StudentsPage() {
  const students = await db.select().from(schema.users).where(eq(schema.users.role, "student")).orderBy(asc(schema.users.createdAt));
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
            </div>
          </ActionForm>
        </Card>
      </section>

      <section>
        <SectionTitle>Все студенты</SectionTitle>
        {students.length === 0 ? (
          <EmptyState title="Пока никого" text="Создай аккаунт выше и передай логин с паролем студенту." />
        ) : (
          <div className="space-y-3">
            {students.map((s) => (
              <Card key={s.id} className="p-4 sm:p-5" data-testid="student-card">
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
