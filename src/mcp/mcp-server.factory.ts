import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from './mcp-context';
import { registerTodoTools } from './tools/todos.tools';
import { registerListTools } from './tools/lists.tools';
import { registerProjectTools } from './tools/projects.tools';
import { registerResources } from './resources';
import { registerPrompts } from './prompts';

// note: mode HTTP stateless membuat McpServer baru di setiap request.
// registrasi tool ringan dan tidak membutuhkan I/O, jadi server tidak perlu
// disimpan atau digunakan ulang antar-request.
export function createMcpServer(ctx: McpContext) {
  const server = new McpServer({ name: 'my-todo', version: '1.0.0' });

  registerTodoTools(server, ctx);
  registerListTools(server, ctx);
  registerProjectTools(server, ctx);
  registerResources(server, ctx);
  registerPrompts(server);

  return server;
}
