import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../mcp-context';
import { serializeKanbanColumn, serializeTodo } from '../serializers';
import { textResult, errorResult } from '../result-helpers';
import { resolveProjectId } from '../name-resolvers';

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function registerKanbanTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'get_board',
    {
      title: 'Get kanban board',
      description:
        "Read a project's kanban board: its columns in order, each with the top-level todos it holds (ordered by position). Use this to see where work stands before calling move_todo.",
      inputSchema: {
        projectName: z.string().describe('Exact name of an existing project'),
        includeCompleted: z
          .boolean()
          .optional()
          .describe('Include completed todos (default true)'),
      },
    },
    async ({ projectName, includeCompleted }) => {
      const project = await resolveProjectId(ctx, projectName);
      if (project.error || !project.id) {
        return errorResult(project.error ?? 'Project wajib diisi');
      }

      const [columns, todos] = await Promise.all([
        ctx.kanbanColumnsService.findAll(project.id, ctx.userId),
        ctx.todosService.findAll(ctx.userId, {
          projectId: project.id,
          completed: includeCompleted === false ? false : undefined,
        }),
      ]);

      const sorted = [...todos].sort((a, b) => a.position - b.position);
      const board = columns.map((column) => ({
        ...serializeKanbanColumn(column),
        todos: sorted
          .filter((todo) => todo.kanbanColumnId === column.id)
          .map((todo) => serializeTodo(todo)),
      }));
      // note: todo yang dibuat sebelum project punya kolom, kanbanColumnId-nya null
      const unassigned = sorted
        .filter((todo) => !todo.kanbanColumnId)
        .map((todo) => serializeTodo(todo));

      const summary = board.length
        ? board
            .map(
              (column) =>
                `## ${column.name} (${column.id})\n${
                  column.todos.length
                    ? column.todos
                        .map(
                          (t) =>
                            `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.id})`,
                        )
                        .join('\n')
                    : '(empty)'
                }`,
            )
            .join('\n\n')
        : 'This project has no kanban columns yet.';

      return textResult(
        unassigned.length
          ? `${summary}\n\n${unassigned.length} todo(s) without a column`
          : summary,
        { projectId: project.id, columns: board, unassigned },
      );
    },
  );

  server.registerTool(
    'move_todo',
    {
      title: 'Move todo on board',
      description:
        "Move a top-level todo to a kanban column of its own project. columnName is matched exactly (case-insensitive) against that project's columns. Omit position to put it at the bottom of the column.",
      inputSchema: {
        id: z.string().describe('Todo id'),
        columnName: z.string().describe('Exact name of the target column'),
        position: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('0-based position in the column (default: bottom)'),
      },
      annotations: { idempotentHint: true },
    },
    async ({ id, columnName, position }) => {
      const todo = await ctx.todosService.findOne(id, ctx.userId);
      if (!todo) return errorResult(`Todo ${id} tidak ditemukan`);
      if (todo.parentId) {
        return errorResult('Subtodo tidak ada di board, pindahkan parent-nya');
      }
      if (!todo.projectId) {
        return errorResult(`Todo "${todo.title}" tidak ada di project manapun`);
      }

      const columns = await ctx.kanbanColumnsService.findAll(
        todo.projectId,
        ctx.userId,
      );
      const matches = columns.filter(
        (column) => column.name.toLowerCase() === columnName.toLowerCase(),
      );
      if (!matches.length) {
        return errorResult(
          `Kolom "${columnName}" tidak ditemukan. Kolom yang ada: ${
            columns.map((column) => column.name).join(', ') || '(none)'
          }`,
        );
      }
      if (matches.length > 1) {
        return errorResult(
          `Ada ${matches.length} kolom bernama "${columnName}"`,
        );
      }

      try {
        // note: service meng-clamp position ke panjang kolom, jadi angka besar = paling bawah
        const moved = await ctx.todosService.move(
          id,
          matches[0].id,
          position ?? Number.MAX_SAFE_INTEGER,
          ctx.userId,
        );
        if (!moved) return errorResult(`Todo ${id} tidak ditemukan`);
        return textResult(
          `Moved "${moved.title}" to ${matches[0].name}`,
          serializeTodo(moved),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to move todo'));
      }
    },
  );

  server.registerTool(
    'create_kanban_column',
    {
      title: 'Create kanban column',
      description: "Add a column to the end of a project's kanban board.",
      inputSchema: {
        projectName: z.string().describe('Exact name of an existing project'),
        name: z.string().min(1),
      },
      annotations: { destructiveHint: false },
    },
    async ({ projectName, name }) => {
      const project = await resolveProjectId(ctx, projectName);
      if (project.error || !project.id) {
        return errorResult(project.error ?? 'Project wajib diisi');
      }

      try {
        const column = await ctx.kanbanColumnsService.create(
          project.id,
          name,
          ctx.userId,
        );
        return textResult(
          `Created column "${column.name}" (${column.id})`,
          serializeKanbanColumn(column),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to create column'));
      }
    },
  );

  server.registerTool(
    'update_kanban_column',
    {
      title: 'Update kanban column',
      description:
        'Rename a kanban column and/or move it to a new 0-based position on its board. Only pass the fields you want to change.',
      inputSchema: {
        id: z.string().describe('Column id (from get_board)'),
        name: z.string().min(1).optional(),
        position: z.number().int().min(0).optional(),
      },
      annotations: { idempotentHint: true },
    },
    async ({ id, name, position }) => {
      try {
        const column = await ctx.kanbanColumnsService.update(
          id,
          { name, position },
          ctx.userId,
        );
        return textResult(
          `Updated column "${column.name}"`,
          serializeKanbanColumn(column),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to update column'));
      }
    },
  );

  server.registerTool(
    'delete_kanban_column',
    {
      title: 'Delete kanban column',
      description:
        'Delete an empty kanban column. Fails if any todo is still in it - move them out first with move_todo.',
      inputSchema: { id: z.string().describe('Column id (from get_board)') },
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    async ({ id }) => {
      try {
        const deleted = await ctx.kanbanColumnsService.remove(id, ctx.userId);
        return textResult(`Deleted column "${deleted.name}"`, {
          id: deleted.id,
        });
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to delete column'));
      }
    },
  );
}
