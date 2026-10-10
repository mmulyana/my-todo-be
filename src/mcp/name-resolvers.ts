import type { McpContext } from './mcp-context';

// note: tool MCP pakai nama, bukan UUID; dicocokkan persis (case-insensitive) hanya di data milik user
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

// note: nama milestone bisa kembar antar project, kalau ambigu error biar AI nggak salah tebak
export async function resolveMilestoneId(
  ctx: McpContext,
  milestoneName: string | null | undefined,
  projectId?: string,
): Promise<{ id?: string | null; error?: string }> {
  if (milestoneName === undefined) return {};
  if (milestoneName === null) return { id: null };

  const milestones = await ctx.milestonesService.findAll(ctx.userId, projectId);
  const matches = milestones.filter(
    (milestone) => milestone.name.toLowerCase() === milestoneName.toLowerCase(),
  );

  if (!matches.length) {
    return { error: `Milestone "${milestoneName}" tidak ditemukan` };
  }
  if (matches.length > 1) {
    return {
      error: `Ada ${matches.length} milestone bernama "${milestoneName}" - sertakan projectName untuk memperjelas`,
    };
  }
  return { id: matches[0].id };
}
