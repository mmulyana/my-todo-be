import { Module } from '@nestjs/common';
import { KanbanColumnsService } from './kanban-columns.service';
import { KanbanColumnsResolver } from './kanban-columns.resolver';
@Module({
  providers: [KanbanColumnsService, KanbanColumnsResolver],
  exports: [KanbanColumnsService],
})
export class KanbanColumnsModule {}
