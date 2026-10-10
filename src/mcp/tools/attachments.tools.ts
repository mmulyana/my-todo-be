import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../mcp-context';
import type { Attachment } from '@/db/schema';
import { serializeAttachment } from '../serializers';
import { textResult, errorResult } from '../result-helpers';
import { resolveProjectId } from '../name-resolvers';

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

// note: AttachmentsService nggak filter per user, jadi kepemilikan dicek di sini (row lama bisa userId null)
async function ownsAttachment(ctx: McpContext, attachment: Attachment) {
  if (attachment.userId === ctx.userId) return true;
  if (attachment.todoId) {
    return Boolean(
      await ctx.todosService.findOne(attachment.todoId, ctx.userId),
    );
  }
  if (attachment.projectId) {
    return Boolean(
      await ctx.projectsService.findOne(attachment.projectId, ctx.userId),
    );
  }
  return false;
}

async function resolveTarget(
  ctx: McpContext,
  todoId: string | undefined,
  projectName: string | undefined,
): Promise<{ todoId?: string; projectId?: string; error?: string }> {
  if (Boolean(todoId) === Boolean(projectName)) {
    return { error: 'Isi salah satu: todoId atau projectName' };
  }
  if (todoId) {
    const todo = await ctx.todosService.findOne(todoId, ctx.userId);
    return todo ? { todoId } : { error: `Todo ${todoId} tidak ditemukan` };
  }
  const project = await resolveProjectId(ctx, projectName);
  if (project.error) return { error: project.error };
  return { projectId: project.id };
}

export function registerAttachmentTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'list_attachments',
    {
      title: 'List attachments',
      description:
        'List the links, files and images attached to a todo or a project. Pass exactly one of todoId or projectName.',
      inputSchema: {
        todoId: z.string().optional(),
        projectName: z
          .string()
          .optional()
          .describe('Exact name of an existing project'),
      },
    },
    async ({ todoId, projectName }) => {
      const target = await resolveTarget(ctx, todoId, projectName);
      if (target.error) return errorResult(target.error);

      const attachments = target.todoId
        ? await ctx.attachmentsService.findByTodoId(target.todoId)
        : await ctx.attachmentsService.findByProjectId(target.projectId!);
      const items = attachments.map(serializeAttachment);

      const summary = items.length
        ? items
            .map(
              (a) =>
                `- [${a.type}] ${a.title ?? a.filename} - ${a.url} (${a.id})`,
            )
            .join('\n')
        : 'No attachments.';

      return textResult(summary, { attachments: items });
    },
  );

  server.registerTool(
    'add_attachment',
    {
      title: 'Add attachment',
      description:
        'Attach a URL to a todo or a project (e.g. a PR, issue, doc or deploy link). Pass exactly one of todoId or projectName. The type (LINK/IMAGE/FILE) is inferred from the URL; for web links the server fetches a title/description preview.',
      inputSchema: {
        url: z.string().url(),
        filename: z
          .string()
          .optional()
          .describe('Display name; defaults to the page title or the URL'),
        todoId: z.string().optional(),
        projectName: z
          .string()
          .optional()
          .describe('Exact name of an existing project'),
      },
      annotations: { destructiveHint: false, openWorldHint: true },
    },
    async ({ url, filename, todoId, projectName }) => {
      const target = await resolveTarget(ctx, todoId, projectName);
      if (target.error) return errorResult(target.error);

      try {
        const attachment = await ctx.attachmentsService.create(ctx.userId, {
          url,
          filename: filename ?? '',
          todoId: target.todoId,
          projectId: target.projectId,
        });
        return textResult(
          `Attached "${attachment.filename}" (${attachment.id})`,
          serializeAttachment(attachment),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to add attachment'));
      }
    },
  );

  server.registerTool(
    'delete_attachment',
    {
      title: 'Delete attachment',
      description:
        'Remove an attachment from its todo/project. This only deletes the record, not the linked resource.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    async ({ id }) => {
      const attachment = await ctx.attachmentsService.findOne(id);
      if (!attachment || !(await ownsAttachment(ctx, attachment))) {
        return errorResult(`Attachment ${id} tidak ditemukan`);
      }

      const deleted = await ctx.attachmentsService.remove(id);
      return textResult(`Deleted attachment "${deleted.filename}"`, {
        id: deleted.id,
      });
    },
  );
}
