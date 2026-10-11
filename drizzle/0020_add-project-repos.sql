ALTER TABLE "Project" ADD COLUMN "repos" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "Todo" ADD COLUMN "repo" text;