import type { TodosService } from '@/todos/todos.service';
import type { ListsService } from '@/lists/lists.service';
import type { ProjectsService } from '@/projects/projects.service';
import type { DocumentsService } from '@/documents/documents.service';
import type { MilestonesService } from '@/milestones/milestones.service';
import type { KanbanColumnsService } from '@/kanban-columns/kanban-columns.service';
import type { AttachmentsService } from '@/attachments/attachments.service';
import type { CalendarEventsService } from '@/calendar-events/calendar-events.service';

// note: pakai service yang sama dengan rest/graphql biar pembatasan data per user dan validasi domain konsisten
export interface McpContext {
  userId: string;
  todosService: TodosService;
  listsService: ListsService;
  projectsService: ProjectsService;
  documentsService: DocumentsService;
  milestonesService: MilestonesService;
  kanbanColumnsService: KanbanColumnsService;
  attachmentsService: AttachmentsService;
  calendarEventsService: CalendarEventsService;
}
