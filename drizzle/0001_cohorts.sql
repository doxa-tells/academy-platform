CREATE TABLE "assignment_deadlines" (
	"assignment_id" uuid NOT NULL,
	"cohort" integer NOT NULL,
	"due_at" timestamp with time zone,
	CONSTRAINT "assignment_deadlines_assignment_id_cohort_pk" PRIMARY KEY("assignment_id","cohort")
);
--> statement-breakpoint
CREATE TABLE "lesson_videos" (
	"lesson_id" uuid NOT NULL,
	"cohort" integer NOT NULL,
	"video_url" text DEFAULT '' NOT NULL,
	CONSTRAINT "lesson_videos_lesson_id_cohort_pk" PRIMARY KEY("lesson_id","cohort")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cohort" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_deadlines" ADD CONSTRAINT "assignment_deadlines_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_videos" ADD CONSTRAINT "lesson_videos_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;