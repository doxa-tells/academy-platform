CREATE TABLE "cohort_lessons" (
	"lesson_id" uuid NOT NULL,
	"cohort" integer NOT NULL,
	"video_url" text DEFAULT '' NOT NULL,
	"opened_at" timestamp with time zone,
	CONSTRAINT "cohort_lessons_lesson_id_cohort_pk" PRIMARY KEY("lesson_id","cohort")
);
--> statement-breakpoint
CREATE TABLE "cohort_modules" (
	"module_id" uuid NOT NULL,
	"cohort" integer NOT NULL,
	"survey_open" boolean DEFAULT false NOT NULL,
	CONSTRAINT "cohort_modules_module_id_cohort_pk" PRIMARY KEY("module_id","cohort")
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "cohort" integer;--> statement-breakpoint
ALTER TABLE "cohort_lessons" ADD CONSTRAINT "cohort_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_modules" ADD CONSTRAINT "cohort_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Перенос данных. Всё, что было до потоков, — это поток 1: его уроки открыты, видео и сроки на месте.
INSERT INTO "cohorts" ("id") VALUES (1) ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "cohorts" ("id") SELECT DISTINCT "cohort" FROM "users" WHERE "cohort" > 0 ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "cohort_lessons" ("lesson_id", "cohort", "video_url", "opened_at")
  SELECT "id", 1, "video_url", now() FROM "lessons" ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Потоки 2+: урок открыт, только если для него уже вставлена запись
INSERT INTO "cohort_lessons" ("lesson_id", "cohort", "video_url", "opened_at")
  SELECT "lesson_id", "cohort", "video_url", CASE WHEN "video_url" <> '' THEN now() END FROM "lesson_videos" ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "assignment_deadlines" ("assignment_id", "cohort", "due_at")
  SELECT "id", 1, "due_at" FROM "assignments" WHERE "due_at" IS NOT NULL ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "cohort_modules" ("module_id", "cohort", "survey_open")
  SELECT "id", 1, true FROM "modules" WHERE "survey_open" ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Посты, написанные до потоков, — для потока 1. Приветствие — всем потокам.
UPDATE "posts" SET "cohort" = 1 WHERE NOT ("kind" = 'announcement' AND "title" = 'Добро пожаловать на курс!');
