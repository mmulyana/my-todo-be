CREATE TABLE "Document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"projectId" uuid,
	"userId" uuid
);
--> statement-breakpoint
CREATE INDEX "document_project_id_idx" ON "Document" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "document_user_id_idx" ON "Document" USING btree ("userId");