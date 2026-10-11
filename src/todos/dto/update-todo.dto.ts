import type { ProseMirrorDoc } from '@/db/schema';

export class UpdateTodoDto {
  title?: string;
  note?: string;
  noteJson?: ProseMirrorDoc | null;
  completed?: boolean;
  important?: boolean;
  priority?: number | null;
  today?: string | null;
  dueDate?: string | null;
  parentId?: string | null;
  listId?: string | null;
  projectId?: string | null;
  milestoneId?: string | null;
  assignee?: string | null;
  repo?: string | null;
}
