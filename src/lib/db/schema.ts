import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: text("role", { enum: ["admin", "student"] }).notNull(),
  name: text("name").notNull(),
  login: text("login").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  sessionVersion: integer("session_version").notNull().default(1),
  active: boolean("active").notNull().default(true),
  telegramChatId: text("telegram_chat_id"),
  telegramUsername: text("telegram_username"),
  telegramLinkCode: text("telegram_link_code"),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: ts("locked_until"),
  lastSeenAt: ts("last_seen_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  surveyOpen: boolean("survey_open").notNull().default(false),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    videoUrl: text("video_url").notNull().default(""),
    position: integer("position").notNull().default(0),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("lessons_module_idx").on(t.moduleId)],
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    dueAt: ts("due_at"),
    position: integer("position").notNull().default(0),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("assignments_module_idx").on(t.moduleId)],
);

export type SubmissionStatus = "submitted" | "in_review" | "revision" | "accepted";

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["submitted", "in_review", "revision", "accepted"] })
      .notNull()
      .default("submitted"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
    lastAttemptAt: ts("last_attempt_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("submissions_assignment_student_uq").on(t.assignmentId, t.studentId)],
);

export const entries = pgTable(
  "submission_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["attempt", "feedback"] }).notNull(),
    text: text("text").notNull().default(""),
    statusChange: text("status_change", { enum: ["submitted", "in_review", "revision", "accepted"] }),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("entries_submission_idx").on(t.submissionId)],
);

export type AnnotationData = {
  strokes: { color: string; width: number; points: [number, number][] }[];
  pins: { x: number; y: number; n: number; color: string }[];
};

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["image", "video", "audio", "file", "annotation"] }).notNull(),
    url: text("url").notNull(),
    contentType: text("content_type").notNull().default(""),
    size: integer("size").notNull().default(0),
    name: text("name").notNull().default(""),
    annotation: jsonb("annotation").$type<AnnotationData>(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("attachments_entry_idx").on(t.entryId)],
);

export const lessonCompletions = pgTable(
  "lesson_completions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: ts("completed_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

export type PostKind = "note" | "prompt" | "link" | "announcement";

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["note", "prompt", "link", "announcement"] }).notNull().default("note"),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  url: text("url").notNull().default(""),
  audience: text("audience", { enum: ["all", "selected"] }).notNull().default("all"),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const postTargets = pgTable(
  "post_targets",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const postReads = pgTable(
  "post_reads",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: ts("read_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const surveyResponses = pgTable(
  "survey_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    improve: text("improve").notNull().default(""),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("survey_module_student_uq").on(t.moduleId, t.studentId)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    refId: text("ref_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sentAt: ts("sent_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reminders_uq").on(t.kind, t.refId, t.userId)],
);

export type User = typeof users.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Post = typeof posts.$inferSelect;
