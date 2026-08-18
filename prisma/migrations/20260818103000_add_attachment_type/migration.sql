-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'FILE', 'LINK');

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN "type" "AttachmentType" NOT NULL DEFAULT 'FILE';
