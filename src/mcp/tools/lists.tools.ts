import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../mcp-context';
import { serializeList } from '../serializers';
import { textResult } from '../result-helpers';

export function registerListTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'list_lists',
    {
      title: 'List lists',
      description:
        "List the user's todo lists, with progress counts. Use a list's name as listName when calling create_todo/update_todo.",
      inputSchema: {},
    },
    async () => {
      const lists = await ctx.listsService.findAll(ctx.userId);
      const items = await Promise.all(
        lists.map(async (list) => {
          const [totalTodo, completedTodos] = await Promise.all([
            ctx.listsService.countTodos(list.id),
            ctx.listsService.countCompletedTodos(list.id),
          ]);
          return serializeList(list, totalTodo, completedTodos);
        }),
      );

      const summary = items.length
        ? items
            .map(
              (list) =>
                `- ${list.name} (${list.completedTodos}/${list.totalTodo})`,
            )
            .join('\n')
        : 'No lists yet.';

      return textResult(summary, { lists: items });
    },
  );
}
