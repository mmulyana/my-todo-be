export class CreateTodoDto {
  title: string;
  note?: string;
  important?: boolean;
  today?: string | null;
  dueDate?: string | null;
  parentId?: string | null;
  listId?: string | null;
  projectId?: string | null;
}
