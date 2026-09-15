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
  ) {}

  @Post()
  async handlePost(
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // note: stateless server dan transport baru dibuat untuk setiap request, lalu
    // dihentikan setelah response selesai. Karena tidak ada session, tidak perlu
    // sticky session meskipun berjalan di beberapa instance
    const server = createMcpServer({
      userId: user.userId,
      todosService: this.todosService,
      listsService: this.listsService,
      projectsService: this.projectsService,
      documentsService: this.documentsService,
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

  // note: get dan delete hanya relevan pada mode stateful tapi tetep ada respons eksplisitnya
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
