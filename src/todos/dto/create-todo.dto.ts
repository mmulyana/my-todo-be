import type { ProseMirrorDoc } from '@/db/schema';

export class CreateTodoDto {
  title: string;
  note?: string;
  noteJson?: ProseMirrorDoc | null;
  important?: boolean;
  priority?: number;
  today?: string | null;
  dueDate?: string | null;
  parentId?: string | null;
  listId?: string | null;
  projectId?: string | null;
  milestoneId?: string | null;
  assignee?: string | null;
  repo?: string | null;
}
