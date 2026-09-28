CREATE TABLE "Milestone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"dueDate" text,
	"position" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"projectId" uuid,
	"userId" uuid
);
--> statement-breakpoint
ALTER TABLE "Todo" ADD COLUMN "milestoneId" uuid;--> statement-breakpoint
CREATE INDEX "milestone_project_position_idx" ON "Milestone" USING btree ("projectId","position");--> statement-breakpoint
CREATE INDEX "todo_milestone_id_idx" ON "Todo" USING btree ("milestoneId");