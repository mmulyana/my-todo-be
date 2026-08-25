CREATE TYPE "public"."AttachmentType" AS ENUM('IMAGE', 'FILE', 'LINK');--> statement-breakpoint
CREATE TABLE "Attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"mimeType" text,
	"size" integer,
	"type" "AttachmentType" DEFAULT 'FILE' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"todoId" uuid,
	"projectId" uuid
);
--> statement-breakpoint
CREATE TABLE "List" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"projectId" uuid
);
--> statement-breakpoint
CREATE TABLE "Project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"parentId" uuid,
	CONSTRAINT "Project_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "Todo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"important" boolean DEFAULT false NOT NULL,
	"today" text,
	"dueDate" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"parentId" uuid,
	"listId" uuid,
	"projectId" uuid
);
