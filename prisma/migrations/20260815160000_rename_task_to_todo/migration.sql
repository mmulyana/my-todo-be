-- Rename Task -> Todo, keeping every row and column as is.
ALTER TABLE "Task" RENAME TO "Todo";

ALTER TABLE "Todo" RENAME CONSTRAINT "Task_pkey" TO "Todo_pkey";
ALTER TABLE "Todo" RENAME CONSTRAINT "Task_parentId_fkey" TO "Todo_parentId_fkey";
ALTER TABLE "Todo" RENAME CONSTRAINT "Task_listId_fkey" TO "Todo_listId_fkey";
ALTER TABLE "Todo" RENAME CONSTRAINT "Task_projectId_fkey" TO "Todo_projectId_fkey";
