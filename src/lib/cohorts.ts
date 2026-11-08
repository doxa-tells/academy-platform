import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "./db";
import type { Assignment, Lesson } from "./db/schema";

/**
 * Потоки (группы набора).
 * Программа и задания общие, а видео уроков и сроки заданий у каждого потока свои:
 * - поток 1 — lessons.video_url и assignments.due_at (как было до потоков);
 * - поток 2, 3, … — таблицы lesson_videos и assignment_deadlines.
 */

export const cohortLabel = (n: number) => `Поток ${n}`;

/** Все потоки, в которых есть студенты, плюс поток 1. По возрастанию. */
export async function getCohorts(): Promise<number[]> {
  const rows = await db
    .selectDistinct({ cohort: schema.users.cohort })
    .from(schema.users)
    .where(eq(schema.users.role, "student"));
  return [...new Set([1, ...rows.map((r) => r.cohort)])].sort((a, b) => a - b);
}

export type CohortOverrides = {
  videos: Map<string, Map<number, string>>;
  dues: Map<string, Map<number, Date | null>>;
};

export async function getCohortOverrides(): Promise<CohortOverrides> {
  const [videos, dues] = await Promise.all([
    db.select().from(schema.lessonVideos),
    db.select().from(schema.assignmentDeadlines),
  ]);
  const ov: CohortOverrides = { videos: new Map(), dues: new Map() };
  for (const v of videos) {
    if (!ov.videos.has(v.lessonId)) ov.videos.set(v.lessonId, new Map());
    ov.videos.get(v.lessonId)!.set(v.cohort, v.videoUrl);
  }
  for (const d of dues) {
    if (!ov.dues.has(d.assignmentId)) ov.dues.set(d.assignmentId, new Map());
    ov.dues.get(d.assignmentId)!.set(d.cohort, d.dueAt);
  }
  return ov;
}

export function videoFor(lesson: Pick<Lesson, "id" | "videoUrl">, cohort: number, ov: CohortOverrides): string {
  if (cohort <= 1) return lesson.videoUrl;
  return ov.videos.get(lesson.id)?.get(cohort) ?? "";
}

export function dueFor(assignment: Pick<Assignment, "id" | "dueAt">, cohort: number, ov: CohortOverrides): Date | null {
  if (cohort <= 1) return assignment.dueAt;
  return ov.dues.get(assignment.id)?.get(cohort) ?? null;
}

/** Копия урока/задания с видео и сроком нужного потока. */
export function lessonForCohort<T extends Lesson>(lesson: T, cohort: number, ov: CohortOverrides): T {
  return cohort <= 1 ? lesson : { ...lesson, videoUrl: videoFor(lesson, cohort, ov) };
}
export function assignmentForCohort<T extends Assignment>(a: T, cohort: number, ov: CohortOverrides): T {
  return cohort <= 1 ? a : { ...a, dueAt: dueFor(a, cohort, ov) };
}

/** Срок задания для одного потока (без загрузки всех переопределений). */
export async function getAssignmentForCohort<T extends Assignment>(a: T, cohort: number): Promise<T> {
  if (cohort <= 1) return a;
  const [row] = await db
    .select()
    .from(schema.assignmentDeadlines)
    .where(and(eq(schema.assignmentDeadlines.assignmentId, a.id), eq(schema.assignmentDeadlines.cohort, cohort)));
  return { ...a, dueAt: row?.dueAt ?? null };
}

export async function saveLessonVideo(lessonId: string, cohort: number, videoUrl: string) {
  await db
    .insert(schema.lessonVideos)
    .values({ lessonId, cohort, videoUrl })
    .onConflictDoUpdate({ target: [schema.lessonVideos.lessonId, schema.lessonVideos.cohort], set: { videoUrl } });
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
