-- AlterTable
ALTER TABLE "Project" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");
