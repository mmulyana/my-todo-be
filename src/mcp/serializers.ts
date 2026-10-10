import type {
  Todo,
  List,
  Project,
  Document,
  Milestone,
  KanbanColumn,
  Attachment,
  CalendarEvent,
} from '@/db/schema';

// note: output dibuat ringkas biar nggak buang context window AI dengan field internal/null
export function serializeTodo(
  todo: Todo,
  names?: {
    listName?: string | null;
    projectName?: string | null;
    milestoneName?: string | null;
  },
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
    milestoneId: todo.milestoneId,
    milestoneName: names?.milestoneName ?? undefined,
    kanbanColumnId: todo.kanbanColumnId,
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
    archivedAt: project.archivedAt,
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

export function serializeMilestone(
  milestone: Milestone,
  countTodo?: number,
  completedTodos?: number,
) {
  return {
    id: milestone.id,
    name: milestone.name,
    description: milestone.description || undefined,
    dueDate: milestone.dueDate,
    projectId: milestone.projectId,
    countTodo,
    completedTodos,
  };
}

export function serializeKanbanColumn(column: KanbanColumn) {
  return {
    id: column.id,
    name: column.name,
    position: column.position,
    projectId: column.projectId,
  };
}

export function serializeAttachment(attachment: Attachment) {
  return {
    id: attachment.id,
    type: attachment.type,
    filename: attachment.filename,
    url: attachment.url,
    title: attachment.title || undefined,
    description: attachment.description || undefined,
    siteName: attachment.siteName || undefined,
    todoId: attachment.todoId,
    projectId: attachment.projectId,
    createdAt: attachment.createdAt,
  };
}

export function serializeCalendarEvent(event: CalendarEvent) {
  return {
    id: event.id,
    title: event.title,
    description: event.description || undefined,
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: event.allDay,
    color: event.color,
    todoId: event.todoId,
  };
}
