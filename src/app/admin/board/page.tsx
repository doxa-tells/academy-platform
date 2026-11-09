import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import { Pin, PinOff } from "@/components/icons";
import { ConfirmButton } from "@/components/action-form";
import { db, schema } from "@/lib/db";
import { PostCard } from "@/components/post-card";
import { PostComposer } from "@/components/post-composer";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { deletePost, setPostCohort, togglePin } from "../actions";
import { cohortLabel, getAdminCohort } from "@/lib/cohorts";
import { formatShort } from "@/lib/format";

export const metadata = { title: "Доска" };

export default async function AdminBoard() {
  const cohort = await getAdminCohort();
  const [posts, allStudents, targets, reads] = await Promise.all([
    db
      .select()
      .from(schema.posts)
      .where(or(eq(schema.posts.cohort, cohort), isNull(schema.posts.cohort)))
      .orderBy(desc(schema.posts.pinned), desc(schema.posts.createdAt)),
    db
      .select({ id: schema.users.id, name: schema.users.name, cohort: schema.users.cohort })
      .from(schema.users)
      .where(and(eq(schema.users.role, "student"), eq(schema.users.active, true)))
      .orderBy(asc(schema.users.createdAt)),
    db.select().from(schema.postTargets),
    db.select().from(schema.postReads),
  ]);
  const students = allStudents.filter((s) => s.cohort === cohort);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Доска" subtitle={`${cohortLabel(cohort)}: посты потока и посты для всех потоков. Видно, кто уже прочитал.`} />
      <section>
        <SectionTitle>Новый пост</SectionTitle>
        <PostComposer students={students} cohort={cohort} />
      </section>
      <section>
        <SectionTitle>Опубликовано</SectionTitle>
        {posts.length === 0 ? (
          <EmptyState title="Постов пока нет" text="Первый пост можно написать выше." />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const audience =
                post.audience === "all"
                  ? allStudents.filter((s) => post.cohort === null || s.cohort === post.cohort)
                  : allStudents.filter((s) => targets.some((t) => t.postId === post.id && t.userId === s.id));
              const readers = audience.map((s) => ({ ...s, read: reads.find((r) => r.postId === post.id && r.userId === s.id) }));
              const readCount = readers.filter((r) => r.read).length;
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  footer={
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 text-sm" data-testid="read-receipts">
                        <p className="font-medium text-ink">
                          {post.audience === "selected" ? "Лично: " : ""}Прочитали {readCount} из {readers.length}
                          <span className="ml-2 text-xs font-normal text-muted" data-testid="post-scope">
                            {post.audience === "selected" ? "" : post.cohort === null ? "· все потоки" : `· ${cohortLabel(post.cohort)}`}
                          </span>
                        </p>
                        <ul className="mt-1.5 flex flex-wrap gap-1.5">
                          {readers.map((r) => (
                            <li
                              key={r.id}
                              title={r.read ? `Прочитано ${formatShort(r.read.readAt)}` : "Ещё не прочитано"}
                              className={r.read ? "rounded-full bg-st-accepted-bg px-2 py-0.5 text-st-accepted" : "rounded-full bg-st-todo-bg px-2 py-0.5 text-st-todo"}
                            >
                              {r.read ? "✓ " : ""}
                              {r.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {post.audience === "all" ? (
                          <form action={setPostCohort.bind(null, post.id, post.cohort === null ? cohort : null)}>
                            <button type="submit" className="px-2 py-1.5 text-xs font-medium text-cobalt hover:underline">
                              {post.cohort === null ? `Только ${cohortLabel(cohort)}` : "Показать всем потокам"}
                            </button>
                          </form>
                        ) : null}
                        <form action={togglePin.bind(null, post.id, !post.pinned)}>
                          <button type="submit" className="rounded-lg p-2 text-ink-2 hover:bg-cobalt/10 hover:text-ink" aria-label={post.pinned ? "Открепить" : "Закрепить"}>
                            {post.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                          </button>
                        </form>
                        <ConfirmButton action={deletePost.bind(null, post.id)} />
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
