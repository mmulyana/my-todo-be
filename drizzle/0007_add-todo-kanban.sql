CREATE TYPE "public"."TodoStatus" AS ENUM('TODO', 'IN_PROGRESS', 'DONE');--> statement-breakpoint
ALTER TABLE "Todo" ADD COLUMN "status" "TodoStatus" DEFAULT 'TODO' NOT NULL;--> statement-breakpoint
ALTER TABLE "Todo" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH ordered_todos AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "userId", "status"
      ORDER BY "createdAt", "id"
    ) - 1 AS "position"
  FROM "Todo"
)
UPDATE "Todo" AS todo
SET "position" = ordered_todos."position"
FROM ordered_todos
WHERE todo."id" = ordered_todos."id";--> statement-breakpoint
CREATE INDEX "todo_user_status_position_idx" ON "Todo" USING btree ("userId","status","position");
