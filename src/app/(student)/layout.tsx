import { requireStudent } from "@/lib/auth";
import { assignmentState, countUnreadPosts, getCourseTree, getStudentState } from "@/lib/course";
import { StudentNav } from "@/components/nav";
import { APP_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudent();
  const [unread, tree, state] = await Promise.all([countUnreadPosts(user.id), getCourseTree(), getStudentState(user.id)]);
  const todo = tree
    .flatMap((m) => m.assignments)
    .filter((a) => assignmentState(a, state.submissions.get(a.id)).needsAction).length;

  return (
    <div className="min-h-dvh md:flex">
      <StudentNav appName={APP_NAME} name={user.name} unread={unread} todo={todo} />
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-14 md:pt-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
