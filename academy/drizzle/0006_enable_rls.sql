ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attendance" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "certificates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cohorts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "discount_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "enrolments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quizzes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tutor_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_badges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Safety net: also lock any other table in the public schema that this database user owns (for example one added by hand in Supabase).
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity AND pg_get_userbyid(c.relowner) = current_user
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
  END LOOP;
END $$;
