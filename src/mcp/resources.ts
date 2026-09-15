import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from './mcp-context';
import {
  serializeDocument,
  serializeList,
  serializeProject,
  serializeTodo,
} from './serializers';

// note: resource memberi konteks lewat @mention tanpa perlu memanggil tool dulu.
export function registerResources(server: McpServer, ctx: McpContext) {
  server.registerResource(
    'lists',
    'todo://lists',
    {
      title: 'Lists',
      description: "The user's todo lists",
      mimeType: 'application/json',
    },
    async (uri) => {
      const lists = await ctx.listsService.findAll(ctx.userId);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(lists.map((list) => serializeList(list))),
          },
        ],
      };
    },
  );

  server.registerResource(
    'projects',
    'todo://projects',
    {
      title: 'Projects',
      description: "The user's projects",
      mimeType: 'application/json',
    },
    async (uri) => {
      const projects = await ctx.projectsService.findAll(ctx.userId);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(
              projects.map((project) => serializeProject(project)),
            ),
          },
        ],
      };
    },
  );

  server.registerResource(
    'todo',
    new ResourceTemplate('todo://todo/{id}', { list: undefined }),
    {
      title: 'Todo',
      description: 'A single todo by id',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const rawId = variables.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const todo = id ? await ctx.todosService.findOne(id, ctx.userId) : null;

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(
              todo ? serializeTodo(todo) : { error: 'not found' },
            ),
          },
        ],
      };
    },
  );

  server.registerResource(
    'documents',
    'todo://documents',
    {
      title: 'Documents',
      description: "The user's documents, without their editor content",
      mimeType: 'application/json',
    },
    async (uri) => {
      const documents = await ctx.documentsService.findAll(ctx.userId);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(
              documents.map((document) => serializeDocument(document)),
            ),
          },
        ],
      };
    },
  );

  server.registerResource(
    'document',
    new ResourceTemplate('todo://document/{id}', { list: undefined }),
    {
      title: 'Document',
      description: 'A single document, including its editor content',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const rawId = variables.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const document = id
        ? await ctx.documentsService.findOne(id, ctx.userId)
        : null;

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(
              document
                ? serializeDocument(document, true)
                : { error: 'not found' },
            ),
          },
        ],
      };
    },
  );
}
