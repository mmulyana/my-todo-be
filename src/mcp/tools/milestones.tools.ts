import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../mcp-context';
import { serializeMilestone, serializeTodo } from '../serializers';
import { textResult, errorResult } from '../result-helpers';
import { resolveProjectId } from '../name-resolvers';

const DATE_SHAPE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "harus format 'yyyy-mm-dd'");

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function registerMilestoneTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'list_milestones',
    {
      title: 'List milestones',
      description:
        "List the user's milestones with progress counts, ordered by position. Pass projectName to only show one project's milestones. Use a milestone's name as milestoneName when calling create_todo/update_todo.",
      inputSchema: {
        projectName: z
          .string()
          .optional()
          .describe('Exact name of an existing project'),
      },
    },
    async ({ projectName }) => {
      const project = await resolveProjectId(ctx, projectName);
      if (project.error) return errorResult(project.error);

      const milestones = await ctx.milestonesService.findAll(
        ctx.userId,
        project.id,
      );
      const items = await Promise.all(
        milestones.map(async (milestone) => {
          const [countTodo, completedTodos] = await Promise.all([
            ctx.milestonesService.countTodos(milestone.id),
            ctx.milestonesService.countCompletedTodos(milestone.id),
          ]);
          return serializeMilestone(milestone, countTodo, completedTodos);
        }),
      );

      const summary = items.length
        ? items
            .map(
              (milestone) =>
                `- ${milestone.name} (${milestone.completedTodos}/${milestone.countTodo})${
                  milestone.dueDate ? ` due ${milestone.dueDate}` : ''
                } (${milestone.id})`,
            )
            .join('\n')
        : 'No milestones yet.';

      return textResult(summary, { milestones: items });
    },
  );

  server.registerTool(
    'get_milestone',
    {
      title: 'Get milestone',
      description:
        'Fetch a single milestone by id, including its project name and progress counts. Optionally include the todos assigned to it.',
      inputSchema: {
        id: z.string().describe('Milestone id'),
        includeTodos: z
          .boolean()
          .optional()
          .describe('Include the todos assigned to this milestone'),
      },
    },
    async ({ id, includeTodos }) => {
      const milestone = await ctx.milestonesService.findOne(id, ctx.userId);
      if (!milestone) {
        return errorResult(`Milestone ${id} tidak ditemukan`);
      }

      const [project, countTodo, completedTodos] = await Promise.all([
        milestone.projectId
          ? ctx.milestonesService.findProject(milestone.projectId)
          : null,
        ctx.milestonesService.countTodos(id),
        ctx.milestonesService.countCompletedTodos(id),
      ]);

      const result: Record<string, unknown> = {
        ...serializeMilestone(milestone, countTodo, completedTodos),
        projectName: project?.name,
      };

      if (includeTodos) {
        const todos = await ctx.milestonesService.findTodos(id, ctx.userId);
        result.todos = todos.map((todo) => serializeTodo(todo));
      }

      return textResult(
        `${milestone.name} - ${completedTodos}/${countTodo} todo(s) done`,
        result,
      );
    },
  );

  server.registerTool(
    'create_milestone',
    {
      title: 'Create milestone',
      description:
        "Create a new milestone. Pass projectName (not an id) to attach it to an existing project - resolved by exact, case-insensitive name match against the user's own projects.",
      inputSchema: {
        name: z.string().min(1),
        description: z.string().optional(),
        dueDate: DATE_SHAPE.optional(),
        projectName: z
          .string()
          .optional()
          .describe('Exact name of an existing project'),
      },
      annotations: { destructiveHint: false },
    },
    async ({ name, description, dueDate, projectName }) => {
      const project = await resolveProjectId(ctx, projectName);
      if (project.error) return errorResult(project.error);

      try {
        const milestone = await ctx.milestonesService.create(ctx.userId, {
          name,
          description,
          dueDate,
          projectId: project.id,
        });
        return textResult(
          `Created milestone "${milestone.name}" (${milestone.id})`,
          serializeMilestone(milestone),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to create milestone'));
      }
    },
  );

  server.registerTool(
    'update_milestone',
    {
      title: 'Update milestone',
      description:
        'Update fields on an existing milestone. Only pass the fields you want to change.',
      inputSchema: {
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        dueDate: DATE_SHAPE.nullable().optional(),
        projectName: z
          .string()
          .optional()
          .describe('Exact name of an existing project to move this to'),
      },
      annotations: { idempotentHint: true },
    },
    async ({ id, name, description, dueDate, projectName }) => {
      const project = await resolveProjectId(ctx, projectName);
      if (project.error) return errorResult(project.error);

      try {
        const updated = await ctx.milestonesService.update(
          id,
          { name, description, dueDate, projectId: project.id },
          ctx.userId,
        );
        if (!updated) return errorResult(`Milestone ${id} tidak ditemukan`);
        return textResult(
          `Updated milestone "${updated.name}"`,
          serializeMilestone(updated),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to update milestone'));
      }
    },
  );

  server.registerTool(
    'delete_milestone',
    {
      title: 'Delete milestone',
      description:
        'Permanently delete a milestone. This cannot be undone - its todos are not deleted and keep pointing at the removed milestone id.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    async ({ id }) => {
      const deleted = await ctx.milestonesService.remove(id, ctx.userId);
      if (!deleted) return errorResult(`Milestone ${id} tidak ditemukan`);
      return textResult(`Deleted milestone "${deleted.name}"`, {
        id: deleted.id,
      });
    },
  );
}
