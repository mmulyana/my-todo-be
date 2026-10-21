import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../mcp-context';
import { serializeProject } from '../serializers';
import { textResult, errorResult } from '../result-helpers';
import { resolveProjectId } from '../name-resolvers';

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

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

  server.registerTool(
    'create_project',
    {
      title: 'Create project',
      description:
        'Create a project (it starts with the default kanban columns Todo, In Progress, Done). Pass parentName to nest it under an existing project. repos are Git repo URLs the agent may work in.',
      inputSchema: {
        name: z.string().min(1),
        description: z.string().optional(),
        code: z.string().optional().describe('Short unique code, e.g. "FE"'),
        color: z.string().optional().describe('Hex color, e.g. "#6366f1"'),
        parentName: z
          .string()
          .optional()
          .describe('Exact name of an existing project to nest under'),
        repos: z
          .array(z.string())
          .optional()
          .describe('Repo URLs, e.g. "https://github.com/owner/name"'),
      },
    },
    async ({ name, description, code, color, parentName, repos }) => {
      const parent = await resolveProjectId(ctx, parentName);
      if (parent.error) return errorResult(parent.error);

      try {
        const project = await ctx.projectsService.create(ctx.userId, {
          name,
          description,
          code,
          color,
          parentId: parent.id,
          repos,
        });
        return textResult(`Created project "${project.name}" (${project.id})`, {
          project: serializeProject(project),
        });
      } catch (err) {
        return errorResult(errorMessage(err, 'Gagal membuat project'));
      }
    },
  );

  server.registerTool(
    'update_project',
    {
      title: 'Update project',
      description:
        'Update a project found by its current name. Only the fields you pass change. Pass null to clear description/code/color/parent. repos replaces the whole list. archived=true/false archives or restores the project and its sub-projects.',
      inputSchema: {
        projectName: z.string().describe('Current exact name of the project'),
        name: z.string().min(1).optional().describe('New name'),
        description: z.string().nullable().optional(),
        code: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
        parentName: z
          .string()
          .nullable()
          .optional()
          .describe(
            'Exact name of the new parent project, or null for top level',
          ),
        repos: z
          .array(z.string())
          .optional()
          .describe('Full replacement list of repo URLs'),
        archived: z.boolean().optional(),
      },
    },
    async ({
      projectName,
      name,
      description,
      code,
      color,
      parentName,
      repos,
      archived,
    }) => {
      // note: cari juga yang terarsip, supaya project bisa di-unarchive lewat nama
      const all = await ctx.projectsService.findAll(ctx.userId, true);
      const target = all.find(
        (project) => project.name.toLowerCase() === projectName.toLowerCase(),
      );
      if (!target)
        return errorResult(`Project "${projectName}" tidak ditemukan`);

      let parentId: string | null | undefined;
      if (parentName === null) parentId = null;
      else if (parentName !== undefined) {
        const parent = await resolveProjectId(ctx, parentName);
        if (parent.error) return errorResult(parent.error);
        parentId = parent.id;
      }

      try {
        let project = await ctx.projectsService.update(
          target.id,
          { name, description, code, color, parentId, repos },
          ctx.userId,
        );
        if (!project)
          return errorResult(`Project "${projectName}" tidak ditemukan`);

        if (archived === true && !target.archivedAt) {
          project =
            (await ctx.projectsService.archive(target.id, ctx.userId)) ??
            project;
        } else if (archived === false && target.archivedAt) {
          project =
            (await ctx.projectsService.unarchive(target.id, ctx.userId)) ??
            project;
        }

        return textResult(`Updated project "${project.name}"`, {
          project: serializeProject(project),
        });
      } catch (err) {
        return errorResult(errorMessage(err, 'Gagal mengubah project'));
      }
    },
  );
}
