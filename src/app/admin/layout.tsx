import { inArray, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { AdminNav } from "@/components/nav";
import { APP_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.submissions)
    .where(inArray(schema.submissions.status, ["submitted", "in_review"]));
  return (
    <div className="min-h-dvh md:flex">
      <AdminNav appName={APP_NAME} name={admin.name} toReview={row?.n ?? 0} />
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-14 md:pt-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
