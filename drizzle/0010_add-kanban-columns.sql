CREATE TABLE "KanbanColumn" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "projectId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "kanban_column_project_position_idx" ON "KanbanColumn" USING btree ("projectId","position");
--> statement-breakpoint
ALTER TABLE "Todo" ADD COLUMN "kanbanColumnId" uuid;
