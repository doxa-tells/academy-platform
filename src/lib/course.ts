import "server-only";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { Assignment, Lesson, Module, Submission, SubmissionStatus, User } from "./db/schema";
import {
  assignmentForCohort,
  getCohortState,
  lessonForCohort,
  moduleForCohort,
  type CohortAssignment,
  type CohortLesson,
  type CohortState,
} from "./cohorts";

export type ModuleNode = Module & { lessons: CohortLesson[]; assignments: CohortAssignment[] };
type RawCourse = { mods: Module[]; less: Lesson[]; asg: Assignment[] };

async function loadCourse(): Promise<RawCourse> {
  const [mods, less, asg] = await Promise.all([
    db.select().from(schema.modules).orderBy(asc(schema.modules.position), asc(schema.modules.createdAt)),
    db.select().from(schema.lessons).orderBy(asc(schema.lessons.position), asc(schema.lessons.createdAt)),
    db.select().from(schema.assignments).orderBy(asc(schema.assignments.position), asc(schema.assignments.createdAt)),
  ]);
  return { mods, less, asg };
}

/** Дерево курса: с cohort — так, как его видит этот поток (замки, видео, сроки, опросы); без — общая программа. */
function buildTree(c: RawCourse, cohort?: number, st?: CohortState): ModuleNode[] {
  return c.mods.map((m) => {
    const lessons = c.less
      .filter((l) => l.moduleId === m.id)
      .map((l) => (cohort && st ? lessonForCohort(l, cohort, st) : { ...l, locked: false, openedAt: null }));
    const assignments = c.asg
      .filter((a) => a.moduleId === m.id)
      .map((a) => (cohort && st ? assignmentForCohort(a, lessons, cohort, st) : { ...a, locked: false }));
    return { ...(cohort && st ? moduleForCohort(m, cohort, st) : m), lessons, assignments };
  });
}

export async function getCourseTree(cohort?: number): Promise<ModuleNode[]> {
  const [course, st] = await Promise.all([loadCourse(), cohort ? getCohortState() : undefined]);
  return buildTree(course, cohort, st);
}

/** Деревья курса для разных потоков за один заход в базу. */
export async function getCourseTrees() {
  const [course, st] = await Promise.all([loadCourse(), getCohortState()]);
  const cache = new Map<number, ModuleNode[]>();
  return (cohort: number) => {
    if (!cache.has(cohort)) cache.set(cohort, buildTree(course, cohort, st));
    return cache.get(cohort)!;
  };
}

export type StudentState = {
  completed: Set<string>;
  submissions: Map<string, Submission>;
  surveys: Map<string, { score: number; createdAt: Date }>;
};

export async function getStudentState(studentId: string): Promise<StudentState> {
  const [comp, subs, surveys] = await Promise.all([
    db.select().from(schema.lessonCompletions).where(eq(schema.lessonCompletions.userId, studentId)),
    db.select().from(schema.submissions).where(eq(schema.submissions.studentId, studentId)),
    db.select().from(schema.surveyResponses).where(eq(schema.surveyResponses.studentId, studentId)),
  ]);
  return {
    completed: new Set(comp.map((c) => c.lessonId)),
    submissions: new Map(subs.map((s) => [s.assignmentId, s])),
    surveys: new Map(surveys.map((s) => [s.moduleId, { score: s.score, createdAt: s.createdAt }])),
  };
}

export type ModuleProgress = {
  module: ModuleNode;
  lessonsDone: number;
  acceptedCount: number;
  total: number;
  done: number;
  percent: number;
  complete: boolean;
  surveyAvailable: boolean;
  surveyDone: boolean;
};

export function computeProgress(tree: ModuleNode[], state: StudentState) {
  const modules: ModuleProgress[] = tree.map((m) => {
    const lessonsDone = m.lessons.filter((l) => state.completed.has(l.id)).length;
    const acceptedCount = m.assignments.filter((a) => state.submissions.get(a.id)?.status === "accepted").length;
    const total = m.lessons.length + m.assignments.length;
    const done = lessonsDone + acceptedCount;
    const complete = total > 0 && done === total;
    const surveyDone = state.surveys.has(m.id);
    return {
      module: m,
      lessonsDone,
      acceptedCount,
      total,
      done,
      percent: total ? Math.round((done / total) * 100) : 0,
      complete,
      surveyAvailable: (m.surveyOpen || complete) && !surveyDone,
      surveyDone,
    };
  });
  const total = modules.reduce((s, m) => s + m.total, 0);
  const done = modules.reduce((s, m) => s + m.done, 0);
  return { modules, total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function assignmentState(a: Assignment & { locked?: boolean }, sub: Submission | undefined, now = new Date()) {
  const status: SubmissionStatus | "todo" = sub?.status ?? "todo";
  // Закрытое задание (урок потока ещё не открыт) ничего не требует, пока по нему нет работы
  const locked = !!a.locked && !sub;
  const needsAction = !locked && (status === "todo" || status === "revision");
  const overdue = !!a.dueAt && a.dueAt.getTime() < now.getTime() && needsAction;
  return { status, needsAction, overdue, locked };
}

/** Посты студента: всем его потока (или всем потокам) плюс адресованные ему лично. */
export function visiblePostsCondition(userId: string, cohort: number) {
  return or(
    and(eq(schema.posts.audience, "all"), or(isNull(schema.posts.cohort), eq(schema.posts.cohort, cohort))),
    sql`exists (select 1 from ${schema.postTargets} pt where pt.post_id = ${schema.posts.id} and pt.user_id = ${userId})`,
  );
}

export async function getPostsForStudent(userId: string, cohort: number) {
  const rows = await db
    .select({
      post: schema.posts,
      readAt: schema.postReads.readAt,
    })
    .from(schema.posts)
    .leftJoin(
      schema.postReads,
      and(eq(schema.postReads.postId, schema.posts.id), eq(schema.postReads.userId, userId)),
    )
    .where(visiblePostsCondition(userId, cohort))
    .orderBy(desc(schema.posts.pinned), desc(schema.posts.createdAt));
  return rows;
}

export async function countUnreadPosts(userId: string, cohort: number) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.posts)
    .where(
      and(
        visiblePostsCondition(userId, cohort),
        sql`not exists (select 1 from ${schema.postReads} pr where pr.post_id = ${schema.posts.id} and pr.user_id = ${userId})`,
      ),
    );
  return row?.n ?? 0;
}

// ---------------------------------------------------------------------------
// "Who is falling behind" report for the admin
// ---------------------------------------------------------------------------

export type RiskLevel = "high" | "medium" | "ok";

export type StudentReport = {
  student: User;
  percent: number;
  overdue: { assignment: Assignment; status: SubmissionStatus | "todo" }[];
  revision: number;
  awaitingReview: number;
  unread: number;
  lastScore: number | null;
  daysInactive: number | null;
  risk: RiskLevel;
  reasons: string[];
};

/** Отчёт по студентам; с cohort — только этого потока. */
export async function getStudentReports(now = new Date(), cohort?: number): Promise<StudentReport[]> {
  const students = await db
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.role, "student"),
        eq(schema.users.active, true),
        cohort ? eq(schema.users.cohort, cohort) : undefined,
      ),
    )
    .orderBy(asc(schema.users.createdAt));
  if (students.length === 0) return [];
  const ids = students.map((s) => s.id);

  const [course, st, comps, subs, surveys, posts, targets, reads] = await Promise.all([
    loadCourse(),
    getCohortState(),
    db.select().from(schema.lessonCompletions).where(inArray(schema.lessonCompletions.userId, ids)),
    db.select().from(schema.submissions).where(inArray(schema.submissions.studentId, ids)),
    db
      .select()
      .from(schema.surveyResponses)
      .where(inArray(schema.surveyResponses.studentId, ids))
      .orderBy(desc(schema.surveyResponses.createdAt)),
    db.select({ id: schema.posts.id, audience: schema.posts.audience, cohort: schema.posts.cohort }).from(schema.posts),
    db.select().from(schema.postTargets),
    db.select().from(schema.postReads).where(inArray(schema.postReads.userId, ids)),
  ]);

  return students
    .map((student) => {
      // Сроки и видео — того потока, в котором учится студент
      const tree = buildTree(course, student.cohort, st);
      const allAssignments = tree.flatMap((m) => m.assignments);
      const state: StudentState = {
        completed: new Set(comps.filter((c) => c.userId === student.id).map((c) => c.lessonId)),
        submissions: new Map(subs.filter((s) => s.studentId === student.id).map((s) => [s.assignmentId, s])),
        surveys: new Map(
          surveys.filter((s) => s.studentId === student.id).map((s) => [s.moduleId, { score: s.score, createdAt: s.createdAt }]),
        ),
      };
      const progress = computeProgress(tree, state);
      const overdue = allAssignments
        .map((a) => ({ a, st: assignmentState(a, state.submissions.get(a.id), now) }))
        .filter((x) => x.st.overdue)
        .map((x) => ({ assignment: x.a, status: x.st.status }));
      const mySubs = [...state.submissions.values()];
      const revision = mySubs.filter((s) => s.status === "revision").length;
      const awaitingReview = mySubs.filter((s) => s.status === "submitted" || s.status === "in_review").length;

      const visible = posts.filter(
        (p) =>
          (p.audience === "all" && (p.cohort === null || p.cohort === student.cohort)) ||
          targets.some((t) => t.postId === p.id && t.userId === student.id),
      );
      const readSet = new Set(reads.filter((r) => r.userId === student.id).map((r) => r.postId));
      const unread = visible.filter((p) => !readSet.has(p.id)).length;

      const lastSurvey = surveys.find((s) => s.studentId === student.id);
      const lastScore = lastSurvey ? lastSurvey.score : null;
      const daysInactive = student.lastSeenAt
        ? Math.floor((now.getTime() - student.lastSeenAt.getTime()) / 86400000)
        : null;

      const reasons: string[] = [];
      let score = 0;
      if (daysInactive === null) {
        reasons.push("ещё ни разу не заходил");
        score += 2;
      } else if (daysInactive >= 5) {
        reasons.push(`не заходил ${daysInactive} дн.`);
        score += 3;
      } else if (daysInactive >= 3) {
        reasons.push(`не заходил ${daysInactive} дн.`);
        score += 1;
      }
      if (overdue.length >= 2) {
        reasons.push(`просрочено заданий: ${overdue.length}`);
        score += 3;
      } else if (overdue.length === 1) {
        reasons.push("просрочено 1 задание");
        score += 1;
      }
      if (revision > 0) {
        reasons.push(`ждёт доработки: ${revision}`);
        score += revision >= 2 ? 2 : 1;
      }
      if (unread >= 3) {
        reasons.push(`не прочитал постов: ${unread}`);
        score += 1;
      }
      if (lastScore !== null && lastScore <= 6) {
        reasons.push(`низкая оценка модуля: ${lastScore}/10`);
        score += 3;
      }
      const risk: RiskLevel = score >= 3 ? "high" : score >= 1 ? "medium" : "ok";
      return {
        student,
        percent: progress.percent,
        overdue,
        revision,
        awaitingReview,
        unread,
        lastScore,
        daysInactive,
        risk,
        reasons,
      };
    })
    .sort((a, b) => riskRank(b.risk) - riskRank(a.risk));
}

function riskRank(r: RiskLevel) {
  return r === "high" ? 2 : r === "medium" ? 1 : 0;
}

export const STATUS_LABEL: Record<SubmissionStatus | "todo", string> = {
  todo: "Не сдано",
  submitted: "Отправлено",
  in_review: "На проверке",
  revision: "Доработать",
  accepted: "Принято",
};
