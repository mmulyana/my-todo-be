INSERT INTO "KanbanColumn" (
	"id",
	"name",
	"position",
	"projectId",
	"userId"
)
SELECT
	gen_random_uuid(),
	default_column."name",
	default_column."position",
	project."id",
	project."userId"
FROM "Project" AS project
CROSS JOIN (
	VALUES
		('Todo', 0),
		('In Progress', 1),
		('Done', 2)
) AS default_column("name", "position")
WHERE project."userId" IS NOT NULL
	AND NOT EXISTS (
		SELECT 1
		FROM "KanbanColumn" AS existing_column
		WHERE existing_column."projectId" = project."id"
	);
--> statement-breakpoint
UPDATE "Todo" AS todo
SET "kanbanColumnId" = (
	SELECT kanban_column."id"
	FROM "KanbanColumn" AS kanban_column
	WHERE kanban_column."projectId" = todo."projectId"
		AND kanban_column."userId" = todo."userId"
	ORDER BY
		CASE
			WHEN kanban_column."position" = CASE todo."status"
				WHEN 'TODO' THEN 0
				WHEN 'IN_PROGRESS' THEN 1
				WHEN 'DONE' THEN 2
			END THEN 0
			ELSE 1
		END,
		kanban_column."position"
	LIMIT 1
)
WHERE todo."projectId" IS NOT NULL
	AND todo."kanbanColumnId" IS NULL;
--> statement-breakpoint
WITH ordered_todos AS (
	SELECT
		"id",
		row_number() OVER (
			PARTITION BY "userId", "projectId", "kanbanColumnId"
			ORDER BY "position", "createdAt", "id"
		) - 1 AS "position"
	FROM "Todo"
	WHERE "kanbanColumnId" IS NOT NULL
)
UPDATE "Todo" AS todo
SET "position" = ordered_todos."position"
FROM ordered_todos
WHERE todo."id" = ordered_todos."id";
--> statement-breakpoint
DROP INDEX "todo_user_status_position_idx";
--> statement-breakpoint
CREATE INDEX "todo_user_kanban_column_position_idx" ON "Todo" USING btree ("userId","kanbanColumnId","position");
--> statement-breakpoint
ALTER TABLE "Todo" DROP COLUMN "status";
--> statement-breakpoint
DROP TYPE "public"."TodoStatus";
