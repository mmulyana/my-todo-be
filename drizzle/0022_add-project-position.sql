ALTER TABLE "Project" ADD COLUMN "position" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "Project" SET "position" = ranked.rn FROM (SELECT "id", (row_number() OVER (PARTITION BY "userId" ORDER BY "createdAt") - 1) AS rn FROM "Project") AS ranked WHERE "Project"."id" = ranked."id";
