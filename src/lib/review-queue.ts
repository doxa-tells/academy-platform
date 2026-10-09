import "server-only";
import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db, schema } from "./db";
import type { SubmissionStatus } from "./db/schema";

export async function getReviewQueue(statuses: SubmissionStatus[] | null, studentId?: string, limit = 200) {
  const conds: SQL[] = [];
  if (statuses) conds.push(inArray(schema.submissions.status, statuses));
  if (studentId) conds.push(eq(schema.submissions.studentId, studentId));
  return db
    .select({
      submission: schema.submissions,
      student: { id: schema.users.id, name: schema.users.name },
      assignment: { id: schema.assignments.id, title: schema.assignments.title, dueAt: schema.assignments.dueAt },
      files: sql<number>`(select count(*)::int from ${schema.attachments} a join ${schema.entries} e on e.id = a.entry_id where e.submission_id = ${schema.submissions.id} and e.kind = 'attempt')`,
    })
    .from(schema.submissions)
    .innerJoin(schema.users, eq(schema.users.id, schema.submissions.studentId))
    .innerJoin(schema.assignments, eq(schema.assignments.id, schema.submissions.assignmentId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(
      sql`case ${schema.submissions.status} when 'submitted' then 0 when 'in_review' then 1 when 'revision' then 2 else 3 end`,
      desc(schema.submissions.lastAttemptAt),
    )
    .limit(limit);
}
