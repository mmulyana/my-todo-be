export class UpdateTodoDto {
  title?: string;
  note?: string;
  completed?: boolean;
  important?: boolean;
  priority?: number | null;
  today?: string | null;
  dueDate?: string | null;
  parentId?: string | null;
  listId?: string | null;
  projectId?: string | null;
}
