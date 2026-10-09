import { and, asc, desc, eq } from "drizzle-orm";
import { Pin, PinOff } from "lucide-react";
import { ConfirmButton } from "@/components/action-form";
import { db, schema } from "@/lib/db";
import { PostCard } from "@/components/post-card";
import { PostComposer } from "@/components/post-composer";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { deletePost, togglePin } from "../actions";
import { formatShort } from "@/lib/format";

export const metadata = { title: "Доска" };

export default async function AdminBoard() {
  const [posts, students, targets, reads] = await Promise.all([
    db.select().from(schema.posts).orderBy(desc(schema.posts.pinned), desc(schema.posts.createdAt)),
    db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(and(eq(schema.users.role, "student"), eq(schema.users.active, true)))
      .orderBy(asc(schema.users.createdAt)),
    db.select().from(schema.postTargets),
    db.select().from(schema.postReads),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Доска" subtitle="Посты видят студенты на своей доске; видно, кто уже прочитал" />
      <section>
        <SectionTitle>Новый пост</SectionTitle>
        <PostComposer students={students} />
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
                  ? students
                  : students.filter((s) => targets.some((t) => t.postId === post.id && t.userId === s.id));
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
                      <div className="flex gap-1">
                        <form action={togglePin.bind(null, post.id, !post.pinned)}>
                          <button type="submit" className="rounded-lg p-2 text-ink-2 hover:bg-ink/5 hover:text-ink" aria-label={post.pinned ? "Открепить" : "Закрепить"}>
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
