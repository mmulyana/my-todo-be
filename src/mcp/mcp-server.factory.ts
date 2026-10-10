import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from './mcp-context';
import { registerTodoTools } from './tools/todos.tools';
import { registerListTools } from './tools/lists.tools';
import { registerProjectTools } from './tools/projects.tools';
import { registerDocumentTools } from './tools/documents.tools';
import { registerMilestoneTools } from './tools/milestones.tools';
import { registerKanbanTools } from './tools/kanban.tools';
import { registerAttachmentTools } from './tools/attachments.tools';
import { registerCalendarEventTools } from './tools/calendar-events.tools';
import { registerResources } from './resources';
import { registerPrompts } from './prompts';

// note: dibuat ulang tiap request (stateless), aman karena registrasi tool ringan dan tanpa I/O
export function createMcpServer(ctx: McpContext) {
  const server = new McpServer({ name: 'my-todo', version: '1.0.0' });

  registerTodoTools(server, ctx);
  registerListTools(server, ctx);
  registerProjectTools(server, ctx);
  registerDocumentTools(server, ctx);
  registerMilestoneTools(server, ctx);
  registerKanbanTools(server, ctx);
  registerAttachmentTools(server, ctx);
  registerCalendarEventTools(server, ctx);
  registerResources(server, ctx);
  registerPrompts(server);

  return server;
}
