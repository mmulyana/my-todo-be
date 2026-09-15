import type { Todo, List, Project, Document } from '@/db/schema';

// note: output tool MCP dibuat ringkas supaya nggak membuang context window dengan field internal dan data null yang nggak dibutuhkan AI.
export function serializeTodo(
  todo: Todo,
  names?: { listName?: string | null; projectName?: string | null },
) {
  return {
    id: todo.id,
    title: todo.title,
    note: todo.note || undefined,
    completed: todo.completed,
    important: todo.important,
    today: todo.today,
    dueDate: todo.dueDate,
    parentId: todo.parentId,
    listId: todo.listId,
    listName: names?.listName ?? undefined,
    projectId: todo.projectId,
    projectName: names?.projectName ?? undefined,
  };
}

export function serializeList(
  list: List,
  totalTodo?: number,
  completedTodos?: number,
) {
  return {
    id: list.id,
    name: list.name,
    projectId: list.projectId,
    totalTodo,
    completedTodos,
  };
}

export function serializeProject(
  project: Project,
  countTodo?: number,
  completedTodos?: number,
) {
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    description: project.description,
    parentId: project.parentId,
    countTodo,
    completedTodos,
  };
}

export function serializeDocument(document: Document, includeContent = false) {
  return {
    id: document.id,
    title: document.title,
    ...(includeContent ? { content: document.content } : {}),
    projectId: document.projectId,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}
