CREATE TABLE "CalendarEvent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"startAt" timestamp with time zone NOT NULL,
	"endAt" timestamp with time zone NOT NULL,
	"allDay" boolean DEFAULT false NOT NULL,
	"color" text,
	"todoId" uuid,
	"userId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "calendar_event_user_start_at_idx" ON "CalendarEvent" USING btree ("userId","startAt");--> statement-breakpoint
CREATE INDEX "calendar_event_todo_id_idx" ON "CalendarEvent" USING btree ("todoId");