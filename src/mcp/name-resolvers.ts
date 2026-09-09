import type { McpContext } from './mcp-context';

// note: Tool MCP pakai nama list/project, bukan UUID. Namanya dicari persis dan cuma dari data milik user aja
type Resolved = { id?: string; error?: string };

export async function resolveListId(
  ctx: McpContext,
  listName: string | undefined,
): Promise<Resolved> {
  if (listName === undefined) return {};

  const lists = await ctx.listsService.findAll(ctx.userId);
  const match = lists.find(
    (list) => list.name.toLowerCase() === listName.toLowerCase(),
  );

  if (!match) {
    return { error: `List "${listName}" tidak ditemukan` };
  }
  return { id: match.id };
}

export async function resolveProjectId(
  ctx: McpContext,
  projectName: string | undefined,
): Promise<Resolved> {
  if (projectName === undefined) return {};

  const projects = await ctx.projectsService.findAll(ctx.userId);
  const match = projects.find(
    (project) => project.name.toLowerCase() === projectName.toLowerCase(),
  );

  if (!match) {
    return { error: `Project "${projectName}" tidak ditemukan` };
  }
  return { id: match.id };
}
