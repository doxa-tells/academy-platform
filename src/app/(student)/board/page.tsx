import { after } from "next/server";
import { requireStudent } from "@/lib/auth";
import { getPostsForStudent } from "@/lib/course";
import { db, schema } from "@/lib/db";
import { PostCard } from "@/components/post-card";
import { EmptyState, PageHeader } from "@/components/ui";
import { plural } from "@/lib/format";

export const metadata = { title: "Доска" };

export default async function BoardPage() {
  const user = await requireStudent();
  const posts = await getPostsForStudent(user.id);
  const unreadIds = posts.filter((p) => !p.readAt).map((p) => p.post.id);

  // Opening the board counts as reading: the teacher sees it in the read receipts.
  if (unreadIds.length > 0) {
    after(async () => {
      await db
        .insert(schema.postReads)
        .values(unreadIds.map((postId) => ({ postId, userId: user.id })))
        .onConflictDoNothing();
    });
  }

  return (
    <div>
      <PageHeader
        title="Доска"
        subtitle={unreadIds.length ? `${plural(unreadIds.length, "новый пост", "новых поста", "новых постов")}` : "Заметки, промпты и объявления от преподавателя"}
      />
      {posts.length === 0 ? (
        <EmptyState title="Пока пусто" text="Здесь появятся заметки, промпты и объявления." />
      ) : (
        <div className="space-y-4">
          {posts.map(({ post, readAt }) => (
            <PostCard key={post.id} post={post} unread={!readAt} personal={post.audience === "selected"} />
          ))}
        </div>
      )}
    </div>
  );
}
