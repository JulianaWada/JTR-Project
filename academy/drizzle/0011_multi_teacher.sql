CREATE TABLE "teacher_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"brand_name" text DEFAULT '' NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"subjects" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"brand_color" text DEFAULT '#1563d6' NOT NULL,
	"logo" text,
	"photo" text,
	"image_version" integer DEFAULT 0 NOT NULL,
	"admin_note" text DEFAULT '' NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "teacher_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "teacher_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Until now the only teacher account was the academy owner (Jules): it becomes the admin.
UPDATE "users" SET "is_admin" = true WHERE "role" = 'teacher';