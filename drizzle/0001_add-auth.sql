CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "Attachment" ADD COLUMN "userId" uuid;--> statement-breakpoint
ALTER TABLE "List" ADD COLUMN "userId" uuid;--> statement-breakpoint
ALTER TABLE "Project" ADD COLUMN "userId" uuid;--> statement-breakpoint
ALTER TABLE "Todo" ADD COLUMN "userId" uuid;