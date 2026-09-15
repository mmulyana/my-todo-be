import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProseMirrorDoc } from '@/db/schema';
import type { McpContext } from '../mcp-context';
import { resolveProjectId } from '../name-resolvers';
import { errorResult, textResult } from '../result-helpers';
import { serializeDocument } from '../serializers';

const documentContentSchema = z
  .object({ type: z.string() })
  .passthrough()
  .describe('ProseMirror/Tiptap JSON document with a root `type` field');

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function registerDocumentTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'list_documents',
    {
      title: 'List documents',
      description:
        "List the user's documents. Optionally filter by an existing project's exact name.",
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

      const documents = await ctx.documentsService.findAll(ctx.userId, project.id);
      const items = documents.map((document) => serializeDocument(document));
      const summary = items.length
        ? items.map((document) => `- ${document.title} (${document.id})`).join('\n')
        : 'No documents found.';
      return textResult(summary, { documents: items });
    },
  );

  server.registerTool(
    'get_document',
    {
      title: 'Get document',
      description: 'Fetch a document by id, including its ProseMirror/Tiptap content.',
      inputSchema: { id: z.string().describe('Document id') },
    },
    async ({ id }) => {
      const document = await ctx.documentsService.findOne(id, ctx.userId);
      if (!document) return errorResult(`Document ${id} tidak ditemukan`);
      return textResult(document.title, serializeDocument(document, true));
    },
  );

  server.registerTool(
    'create_document',
    {
      title: 'Create document',
      description:
        'Create a document. Content must be a ProseMirror/Tiptap JSON document when supplied.',
      inputSchema: {
        title: z.string().min(1),
        content: documentContentSchema.optional(),
        projectName: z
          .string()
          .optional()
          .describe('Exact name of an existing project'),
      },
      annotations: { destructiveHint: false },
    },
    async ({ title, content, projectName }) => {
      const project = await resolveProjectId(ctx, projectName);
      if (project.error) return errorResult(project.error);

      try {
        const document = await ctx.documentsService.create(ctx.userId, {
          title,
          content: content as ProseMirrorDoc | undefined,
          projectId: project.id,
        });
        return textResult(
          `Created "${document.title}" (${document.id})`,
          serializeDocument(document, true),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to create document'));
      }
    },
  );

  server.registerTool(
    'update_document',
    {
      title: 'Update document',
      description:
        'Update a document. Pass projectName to move it, or null to remove its project.',
      inputSchema: {
        id: z.string().describe('Document id'),
        title: z.string().min(1).optional(),
        content: documentContentSchema.nullable().optional(),
        projectName: z
          .string()
          .nullable()
          .optional()
          .describe('Exact name of an existing project, or null to remove it'),
      },
      annotations: { idempotentHint: true },
    },
    async ({ id, title, content, projectName }) => {
      const project =
        projectName === null
          ? { id: null }
          : await resolveProjectId(ctx, projectName);
      if ('error' in project && project.error) return errorResult(project.error);

      try {
        const document = await ctx.documentsService.update(
          id,
          {
            title,
            content: content as ProseMirrorDoc | null | undefined,
            projectId: project.id,
          },
          ctx.userId,
        );
        if (!document) return errorResult(`Document ${id} tidak ditemukan`);
        return textResult(
          `Updated "${document.title}"`,
          serializeDocument(document, true),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to update document'));
      }
    },
  );

  server.registerTool(
    'delete_document',
    {
      title: 'Delete document',
      description: 'Permanently delete a document. This cannot be undone.',
      inputSchema: { id: z.string().describe('Document id') },
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    async ({ id }) => {
      const document = await ctx.documentsService.remove(id, ctx.userId);
      if (!document) return errorResult(`Document ${id} tidak ditemukan`);
      return textResult(`Deleted "${document.title}"`, { id: document.id });
    },
  );
}
