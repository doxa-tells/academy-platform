import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/nav";
import { CohortTabs } from "@/components/cohort-tabs";
import { getAdminCohort, getCohortList } from "@/lib/cohorts";
import { APP_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const cohorts = await getCohortList();
  const current = await getAdminCohort(cohorts.map((c) => c.id));
  const toReview = cohorts.reduce((s, c) => s + c.toReview, 0);
  return (
    <div className="min-h-dvh md:flex">
      <AdminNav appName={APP_NAME} name={admin.name} toReview={toReview} />
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-14 md:pt-10">
        <div className="mx-auto max-w-5xl">
          <CohortTabs cohorts={cohorts} current={current} />
          {children}
        </div>
      </main>
    </div>
  );
}
