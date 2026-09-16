import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../mcp-context';
import { serializeProject } from '../serializers';
import { textResult } from '../result-helpers';

export function registerProjectTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description:
        "List the user's projects, with progress counts. Archived projects are hidden unless includeArchived is true. Use a project's name as projectName when calling create_todo/update_todo.",
      inputSchema: {
        includeArchived: z
          .boolean()
          .optional()
          .describe('Include archived projects (default false)'),
      },
    },
    async ({ includeArchived }) => {
      const projects = await ctx.projectsService.findAll(
        ctx.userId,
        includeArchived ?? false,
      );
      const items = await Promise.all(
        projects.map(async (project) => {
          const [countTodo, completedTodos] = await Promise.all([
            ctx.projectsService.countTodos(project.id, ctx.userId),
            ctx.projectsService.countCompletedTodos(project.id),
          ]);
          return serializeProject(project, countTodo, completedTodos);
        }),
      );

      const summary = items.length
        ? items
            .map(
              (project) =>
                `- ${project.name} (${project.completedTodos}/${project.countTodo})${
                  project.archivedAt ? ' [archived]' : ''
                }`,
            )
            .join('\n')
        : 'No projects yet.';

      return textResult(summary, { projects: items });
    },
  );
}
