import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpAuthGuard } from './mcp-auth.guard';
import { createMcpServer } from './mcp-server.factory';
import { CurrentUser } from '@/auth/current-user.decorator';
import { TodosService } from '@/todos/todos.service';
import { ListsService } from '@/lists/lists.service';
import { ProjectsService } from '@/projects/projects.service';
import { DocumentsService } from '@/documents/documents.service';
import { MilestonesService } from '@/milestones/milestones.service';
import { KanbanColumnsService } from '@/kanban-columns/kanban-columns.service';
import { AttachmentsService } from '@/attachments/attachments.service';
import { CalendarEventsService } from '@/calendar-events/calendar-events.service';

const STATELESS_NOTICE = {
  error:
    'This MCP server runs in stateless mode - every request is a self-contained JSON-RPC call over POST.',
};

@Controller('mcp')
@UseGuards(McpAuthGuard)
export class McpController {
  constructor(
    private readonly todosService: TodosService,
    private readonly listsService: ListsService,
    private readonly projectsService: ProjectsService,
    private readonly documentsService: DocumentsService,
    private readonly milestonesService: MilestonesService,
    private readonly kanbanColumnsService: KanbanColumnsService,
    private readonly attachmentsService: AttachmentsService,
    private readonly calendarEventsService: CalendarEventsService,
  ) {}

  @Post()
  async handlePost(
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // note: tanpa session, jadi nggak butuh sticky session walau jalan di banyak instance
    const server = createMcpServer({
      userId: user.userId,
      todosService: this.todosService,
      listsService: this.listsService,
      projectsService: this.projectsService,
      documentsService: this.documentsService,
      milestonesService: this.milestonesService,
      kanbanColumnsService: this.kanbanColumnsService,
      attachmentsService: this.attachmentsService,
      calendarEventsService: this.calendarEventsService,
    });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  // note: get/delete cuma relevan di mode stateful, tetap dijawab 405 biar client dapat pesan jelas
  @Get()
  @HttpCode(405)
  handleGet() {
    return STATELESS_NOTICE;
  }

  @Delete()
  @HttpCode(405)
  handleDelete() {
    return STATELESS_NOTICE;
  }
}
