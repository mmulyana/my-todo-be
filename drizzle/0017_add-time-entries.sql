CREATE TABLE "TimeEntry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"startedAt" timestamp with time zone NOT NULL,
	"endedAt" timestamp with time zone,
	"todoId" uuid,
	"userId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "time_entry_user_started_at_idx" ON "TimeEntry" USING btree ("userId","startedAt");--> statement-breakpoint
CREATE INDEX "time_entry_todo_id_idx" ON "TimeEntry" USING btree ("todoId");