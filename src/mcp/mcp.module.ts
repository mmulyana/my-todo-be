import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { McpController } from './mcp.controller';
import { McpAuthGuard } from './mcp-auth.guard';
import { TokensModule } from '@/tokens/tokens.module';
import { TodosModule } from '@/todos/todos.module';
import { ListsModule } from '@/lists/lists.module';
import { ProjectsModule } from '@/projects/projects.module';
import { DocumentsModule } from '@/documents/documents.module';
import { MilestonesModule } from '@/milestones/milestones.module';
import { KanbanColumnsModule } from '@/kanban-columns/kanban-columns.module';
import { AttachmentsModule } from '@/attachments/attachments.module';
import { CalendarEventsModule } from '@/calendar-events/calendar-events.module';

@Module({
  imports: [
    TokensModule,
    TodosModule,
    ListsModule,
    ProjectsModule,
    DocumentsModule,
    MilestonesModule,
    KanbanColumnsModule,
    AttachmentsModule,
    CalendarEventsModule,
    JwtModule.register({}),
  ],
  controllers: [McpController],
  providers: [McpAuthGuard],
})
export class McpModule {}
