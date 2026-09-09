import type { TodosService } from '@/todos/todos.service';
import type { ListsService } from '@/lists/lists.service';
import type { ProjectsService } from '@/projects/projects.service';

// note: Berisi userId yang sudah terautentikasi dan service yang sama seperti rest/graphqL, biar pembatasan data dan validasi domain jdi konsisten
export interface McpContext {
  userId: string;
  todosService: TodosService;
  listsService: ListsService;
  projectsService: ProjectsService;
}
