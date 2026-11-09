import "server-only";
import { cookies } from "next/headers";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { Assignment, Lesson, Module } from "./db/schema";

/**
 * Потоки (группы набора).
 * Программа — модули, уроки, задания — общая. У каждого потока своё:
 * - открыт ли урок (закрытый студент видит с замком, его задание сдать нельзя),
 * - запись урока,
 * - срок сдачи задания,
 * - открыт ли опрос после модуля.
 */

export const cohortLabel = (n: number) => `Поток ${n}`;
export const ADMIN_COHORT_COOKIE = "admin_cohort";

export type CohortInfo = { id: number; title: string; students: number; toReview: number };

/** Все потоки по возрастанию, со счётчиками студентов и работ на проверке. */
export async function getCohortList(): Promise<CohortInfo[]> {
  const [rows, students, pending] = await Promise.all([
    db.select().from(schema.cohorts).orderBy(asc(schema.cohorts.id)),
    db
      .select({ cohort: schema.users.cohort, n: sql<number>`count(*)::int` })
      .from(schema.users)
      .where(and(eq(schema.users.role, "student"), eq(schema.users.active, true)))
      .groupBy(schema.users.cohort),
    db
      .select({ cohort: schema.users.cohort, n: sql<number>`count(*)::int` })
      .from(schema.submissions)
      .innerJoin(schema.users, eq(schema.users.id, schema.submissions.studentId))
      .where(inArray(schema.submissions.status, ["submitted", "in_review"]))
      .groupBy(schema.users.cohort),
  ]);
  const ids = [...new Set([1, ...rows.map((r) => r.id), ...students.map((s) => s.cohort)])].sort((a, b) => a - b);
  return ids.map((id) => ({
    id,
    title: rows.find((r) => r.id === id)?.title || cohortLabel(id),
    students: students.find((s) => s.cohort === id)?.n ?? 0,
    toReview: pending.find((p) => p.cohort === id)?.n ?? 0,
  }));
}

export async function getCohorts(): Promise<number[]> {
  return (await getCohortList()).map((c) => c.id);
}

/** Поток, с которым сейчас работает админ (запоминается в cookie). По умолчанию — самый новый. */
export async function getAdminCohort(list?: number[]): Promise<number> {
  const ids = list ?? (await getCohorts());
  const raw = Number((await cookies()).get(ADMIN_COHORT_COOKIE)?.value);
  return ids.includes(raw) ? raw : Math.max(...ids);
}

export async function ensureCohort(id: number) {
  await db.insert(schema.cohorts).values({ id }).onConflictDoNothing();
}

// ---------------------------------------------------------------------------
// Состояние курса в потоках
// ---------------------------------------------------------------------------

export type CohortState = {
  lessons: Map<string, Map<number, { videoUrl: string; openedAt: Date | null }>>;
  dues: Map<string, Map<number, Date | null>>;
  surveys: Map<string, Map<number, boolean>>;
};

export async function getCohortState(): Promise<CohortState> {
  const [lessons, dues, surveys] = await Promise.all([
    db.select().from(schema.cohortLessons),
    db.select().from(schema.assignmentDeadlines),
    db.select().from(schema.cohortModules),
  ]);
  const put = <V,>(m: Map<string, Map<number, V>>, id: string, cohort: number, v: V) => {
    if (!m.has(id)) m.set(id, new Map());
    m.get(id)!.set(cohort, v);
  };
  const st: CohortState = { lessons: new Map(), dues: new Map(), surveys: new Map() };
  for (const l of lessons) put(st.lessons, l.lessonId, l.cohort, { videoUrl: l.videoUrl, openedAt: l.openedAt });
  for (const d of dues) put(st.dues, d.assignmentId, d.cohort, d.dueAt);
  for (const m of surveys) put(st.surveys, m.moduleId, m.cohort, m.surveyOpen);
  return st;
}

export const videoFor = (lessonId: string, cohort: number, st: CohortState) => st.lessons.get(lessonId)?.get(cohort)?.videoUrl ?? "";
export const openedFor = (lessonId: string, cohort: number, st: CohortState) => st.lessons.get(lessonId)?.get(cohort)?.openedAt ?? null;
export const dueFor = (assignmentId: string, cohort: number, st: CohortState) => st.dues.get(assignmentId)?.get(cohort) ?? null;
export const surveyOpenFor = (moduleId: string, cohort: number, st: CohortState) => st.surveys.get(moduleId)?.get(cohort) ?? false;

/** Урок так, как его видит поток: своя запись, открыт или закрыт. */
export type CohortLesson = Lesson & { locked: boolean; openedAt: Date | null };
/** Задание так, как его видит поток: свой срок; закрыто, пока не открыт его урок. */
export type CohortAssignment = Assignment & { locked: boolean };

export function lessonForCohort(lesson: Lesson, cohort: number, st: CohortState): CohortLesson {
  const openedAt = openedFor(lesson.id, cohort, st);
  return { ...lesson, videoUrl: videoFor(lesson.id, cohort, st), openedAt, locked: !openedAt };
}

/**
 * Задание закрыто, пока закрыт его урок. Задание без урока закрыто,
 * пока в его модуле не открыт ни один урок (если уроков в модуле нет — открыто).
 */
export function assignmentForCohort(a: Assignment, lessons: CohortLesson[], cohort: number, st: CohortState): CohortAssignment {
  const own = a.lessonId ? lessons.find((l) => l.id === a.lessonId) : undefined;
  const moduleLessons = lessons.filter((l) => l.moduleId === a.moduleId);
  const locked = own ? own.locked : moduleLessons.length > 0 && moduleLessons.every((l) => l.locked);
  return { ...a, dueAt: dueFor(a.id, cohort, st), locked };
}

export function moduleForCohort<M extends Module>(m: M, cohort: number, st: CohortState): M {
  return { ...m, surveyOpen: surveyOpenFor(m.id, cohort, st) };
}

/** Задание для одного потока (страница задания, проверка работы). */
export async function getAssignmentForCohort(a: Assignment, cohort: number): Promise<CohortAssignment> {
  const [lessonRows, due] = await Promise.all([
    db
      .select({ id: schema.lessons.id, openedAt: schema.cohortLessons.openedAt })
      .from(schema.lessons)
      .leftJoin(
        schema.cohortLessons,
        and(eq(schema.cohortLessons.lessonId, schema.lessons.id), eq(schema.cohortLessons.cohort, cohort)),
      )
      .where(eq(schema.lessons.moduleId, a.moduleId)),
    db
      .select({ dueAt: schema.assignmentDeadlines.dueAt })
      .from(schema.assignmentDeadlines)
      .where(and(eq(schema.assignmentDeadlines.assignmentId, a.id), eq(schema.assignmentDeadlines.cohort, cohort))),
  ]);
  const own = a.lessonId ? lessonRows.find((l) => l.id === a.lessonId) : undefined;
  const locked = own ? !own.openedAt : lessonRows.length > 0 && lessonRows.every((l) => !l.openedAt);
  return { ...a, dueAt: due[0]?.dueAt ?? null, locked };
}

// ---------------------------------------------------------------------------
// Запись
// ---------------------------------------------------------------------------

export async function saveLessonVideo(lessonId: string, cohort: number, videoUrl: string) {
  await db
    .insert(schema.cohortLessons)
    .values({ lessonId, cohort, videoUrl })
    .onConflictDoUpdate({ target: [schema.cohortLessons.lessonId, schema.cohortLessons.cohort], set: { videoUrl } });
}

export async function setLessonOpened(lessonId: string, cohort: number, openedAt: Date | null) {
  await db
    .insert(schema.cohortLessons)
    .values({ lessonId, cohort, openedAt })
    .onConflictDoUpdate({ target: [schema.cohortLessons.lessonId, schema.cohortLessons.cohort], set: { openedAt } });
}

export async function saveAssignmentDeadline(assignmentId: string, cohort: number, dueAt: Date | null) {
  await db
    .insert(schema.assignmentDeadlines)
    .values({ assignmentId, cohort, dueAt })
    .onConflictDoUpdate({
      target: [schema.assignmentDeadlines.assignmentId, schema.assignmentDeadlines.cohort],
      set: { dueAt },
    });
}

export async function setModuleSurveyOpen(moduleId: string, cohort: number, surveyOpen: boolean) {
  await db
    .insert(schema.cohortModules)
    .values({ moduleId, cohort, surveyOpen })
    .onConflictDoUpdate({ target: [schema.cohortModules.moduleId, schema.cohortModules.cohort], set: { surveyOpen } });
}
