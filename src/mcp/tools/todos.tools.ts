import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../mcp-context';
import { serializeTodo } from '../serializers';
import { textResult, errorResult } from '../result-helpers';
import { resolveListId, resolveProjectId } from '../name-resolvers';
import { TodoView } from '@/todos/dto/todo-filter.input';

const DEFAULT_LIST_LIMIT = 25;
const MAX_LIST_LIMIT = 100;
const DATE_SHAPE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "harus format 'yyyy-mm-dd'");

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function registerTodoTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'list_todos',
    {
      title: 'List todos',
      description:
        "Browse or search the user's todos. `q` does a full-text search over title/note and overrides the other filters. Only top-level todos are returned - use get_todo with includeSubtodos to see children.",
      inputSchema: {
        view: z
          .enum(['today', 'important', 'all'])
          .optional()
          .describe('Built-in smart list'),
        listId: z.string().optional().describe('Filter by list id'),
        projectId: z.string().optional().describe('Filter by project id'),
        q: z
          .string()
          .optional()
          .describe('Full-text search over title and note'),
        completed: z
          .boolean()
          .optional()
          .describe('Filter by completion state'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_LIST_LIMIT)
          .optional()
          .describe(
            `Max rows to return (default ${DEFAULT_LIST_LIMIT}, max ${MAX_LIST_LIMIT})`,
          ),
      },
    },
    async ({ view, listId, projectId, q, completed, limit }) => {
      const todos = await ctx.todosService.findAll(ctx.userId, {
        view: view as TodoView | undefined,
        listId,
        projectId,
        q,
        completed,
      });

      const [lists, projects] = await Promise.all([
        ctx.listsService.findAll(ctx.userId),
        ctx.projectsService.findAll(ctx.userId),
      ]);
      const listNames = new Map(lists.map((list) => [list.id, list.name]));
      const projectNames = new Map(
        projects.map((project) => [project.id, project.name]),
      );

      const clamp = Math.min(limit ?? DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT);
      const items = todos.slice(0, clamp).map((todo) =>
        serializeTodo(todo, {
          listName: todo.listId ? listNames.get(todo.listId) : undefined,
          projectName: todo.projectId
            ? projectNames.get(todo.projectId)
            : undefined,
        }),
      );

      const summary = items.length
        ? items
            .map((t) => `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.id})`)
            .join('\n')
        : 'No todos found.';

      return textResult(summary, { todos: items });
    },
  );

  server.registerTool(
    'get_todo',
    {
      title: 'Get todo',
      description:
        'Fetch a single todo by id, including its list/project name and subtodo progress counters. Optionally include its direct (1 level) subtodos.',
      inputSchema: {
        id: z.string().describe('Todo id'),
        includeSubtodos: z
          .boolean()
          .optional()
          .describe('Include direct (1 level) subtodos'),
      },
    },
    async ({ id, includeSubtodos }) => {
      const todo = await ctx.todosService.findOne(id, ctx.userId);
      if (!todo) {
        return errorResult(`Todo ${id} tidak ditemukan`);
      }

      const [list, project, subtodoCount, completedTodos] = await Promise.all([
        todo.listId ? ctx.todosService.findList(todo.listId, ctx.userId) : null,
        todo.projectId
          ? ctx.todosService.findProject(todo.projectId, ctx.userId)
          : null,
        ctx.todosService.countSubtodos(id, ctx.userId),
        ctx.todosService.countCompletedSubtodos(id, ctx.userId),
      ]);

      const result: Record<string, unknown> = {
        ...serializeTodo(todo, {
          listName: list?.name,
          projectName: project?.name,
        }),
        subtodoCount,
        completedTodos,
      };

      if (includeSubtodos) {
        const subtodos = await ctx.todosService.findSubtodos(id, ctx.userId);
        result.subtodos = subtodos.map((subtodo) => serializeTodo(subtodo));
      }

      return textResult(
        `${todo.title}${todo.completed ? ' (completed)' : ''} - ${completedTodos}/${subtodoCount} subtodo(s) done`,
        result,
      );
    },
  );

  server.registerTool(
    'create_todo',
    {
      title: 'Create todo',
      description:
        "Create a new todo, or a subtodo when parentId is given. Pass listName/projectName (not ids) to file it under an existing list or project - resolved by exact, case-insensitive name match against the user's own lists/projects.",
      inputSchema: {
        title: z.string().min(1),
        note: z.string().optional(),
        important: z.boolean().optional(),
        today: DATE_SHAPE.optional().describe("Mark as today's todo"),
        dueDate: DATE_SHAPE.optional(),
        parentId: z
          .string()
          .optional()
          .describe('Create as a subtodo of this todo id'),
        listName: z
          .string()
          .optional()
          .describe('Exact name of an existing list'),
        projectName: z
          .string()
          .optional()
          .describe('Exact name of an existing project'),
      },
      annotations: { destructiveHint: false },
    },
    async ({
      title,
      note,
      important,
      today,
      dueDate,
      parentId,
      listName,
      projectName,
    }) => {
      const list = await resolveListId(ctx, listName);
      if (list.error) return errorResult(list.error);
      const project = await resolveProjectId(ctx, projectName);
      if (project.error) return errorResult(project.error);

      try {
        const todo = await ctx.todosService.create(ctx.userId, {
          title,
          note,
          important,
          today,
          dueDate,
          parentId,
          listId: list.id,
          projectId: project.id,
        });
        return textResult(
          `Created "${todo.title}" (${todo.id})`,
          serializeTodo(todo),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to create todo'));
      }
    },
  );

  server.registerTool(
    'update_todo',
    {
      title: 'Update todo',
      description:
        'Update fields on an existing todo. Only pass the fields you want to change.',
      inputSchema: {
        id: z.string(),
        title: z.string().min(1).optional(),
        note: z.string().optional(),
        important: z.boolean().optional(),
        today: DATE_SHAPE.nullable().optional(),
        dueDate: DATE_SHAPE.nullable().optional(),
        parentId: z
          .string()
          .nullable()
          .optional()
          .describe('Move under a new parent, or null to make it top-level'),
        listName: z
          .string()
          .optional()
          .describe('Exact name of an existing list to move this to'),
        projectName: z
          .string()
          .optional()
          .describe('Exact name of an existing project to move this to'),
      },
      annotations: { idempotentHint: true },
    },
    async ({
      id,
      title,
      note,
      important,
      today,
      dueDate,
      parentId,
      listName,
      projectName,
    }) => {
      const list = await resolveListId(ctx, listName);
      if (list.error) return errorResult(list.error);
      const project = await resolveProjectId(ctx, projectName);
      if (project.error) return errorResult(project.error);

      try {
        const updated = await ctx.todosService.update(
          id,
          {
            title,
            note,
            important,
            today,
            dueDate,
            parentId,
            listId: list.id,
            projectId: project.id,
          },
          ctx.userId,
        );
        if (!updated) return errorResult(`Todo ${id} tidak ditemukan`);
        return textResult(`Updated "${updated.title}"`, serializeTodo(updated));
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to update todo'));
      }
    },
  );

  server.registerTool(
    'set_todo_completed',
    {
      title: 'Mark todo done/undone',
      description:
        'Set the completed state of a todo. Prefer this over update_todo for checking things off.',
      inputSchema: {
        id: z.string(),
        completed: z.boolean(),
      },
      annotations: { idempotentHint: true },
    },
    async ({ id, completed }) => {
      const updated = await ctx.todosService.update(
        id,
        { completed },
        ctx.userId,
      );
      if (!updated) return errorResult(`Todo ${id} tidak ditemukan`);
      return textResult(
        `"${updated.title}" marked as ${completed ? 'completed' : 'not completed'}`,
        serializeTodo(updated),
      );
    },
  );

  server.registerTool(
    'delete_todo',
    {
      title: 'Delete todo',
      description:
        'Permanently delete a todo. This cannot be undone - subtodos are not deleted along with it and are left without a parent.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    async ({ id }) => {
      const deleted = await ctx.todosService.remove(id, ctx.userId);
      if (!deleted) return errorResult(`Todo ${id} tidak ditemukan`);
      return textResult(`Deleted "${deleted.title}"`, { id: deleted.id });
    },
  );
}
