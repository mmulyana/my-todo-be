CREATE TABLE "ApiToken" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"prefix" text NOT NULL,
	"tokenHash" text NOT NULL,
	"scopes" text DEFAULT 'read,write' NOT NULL,
	"lastUsedAt" timestamp with time zone,
	"expiresAt" timestamp with time zone,
	"revokedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ApiToken_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE INDEX "api_token_user_id_idx" ON "ApiToken" USING btree ("userId");