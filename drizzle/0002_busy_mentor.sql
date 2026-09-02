CREATE INDEX "todo_parent_id_idx" ON "Todo" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "todo_list_id_idx" ON "Todo" USING btree ("listId");--> statement-breakpoint
CREATE INDEX "todo_project_id_idx" ON "Todo" USING btree ("projectId");