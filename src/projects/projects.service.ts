import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { projects, lists, todos, attachments } from '@/db/schema';
import { eq, isNull, and, asc, count, inArray } from 'drizzle-orm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly db: DbService) {}

  async create(userId: string, dto: CreateProjectDto) {
    const [project] = await this.db.db
      .insert(projects)
      .values({
        name: dto.name,
        code: dto.code,
        description: dto.description,
        parentId: dto.parentId ?? null,
        userId,
      })
      .returning();
    return project;
  }

  findAll(userId: string, includeArchived = false) {
    return this.db.db
      .select()
      .from(projects)
      .where(
        includeArchived
          ? eq(projects.userId, userId)
          : and(eq(projects.userId, userId), isNull(projects.archivedAt)),
      )
      .orderBy(asc(projects.createdAt));
  }

  async findOne(id: string, userId: string) {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return project ?? null;
  }

  async findByCode(code: string, userId: string) {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(and(eq(projects.code, code), eq(projects.userId, userId)));
    return project ?? null;
  }

  findChildren(parentId: string, userId: string, includeArchived = false) {
    return this.db.db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.parentId, parentId),
          eq(projects.userId, userId),
          includeArchived ? undefined : isNull(projects.archivedAt),
        ),
      )
      .orderBy(asc(projects.createdAt));
  }

  findLists(projectId: string) {
    return this.db.db
      .select()
      .from(lists)
      .where(eq(lists.projectId, projectId))
      .orderBy(asc(lists.createdAt));
  }

  findTodos(projectId: string) {
    return this.db.db
      .select()
      .from(todos)
      .where(and(eq(todos.projectId, projectId), isNull(todos.parentId)))
      .orderBy(asc(todos.createdAt));
  }

  async countTodos(projectId: string, userId: string) {
    const [result] = await this.db.db
      .select({ value: count() })
      .from(todos)
      .where(and(eq(todos.projectId, projectId), eq(todos.userId, userId)));
    return result.value;
  }

  async countCompletedTodos(projectId: string) {
    const [result] = await this.db.db
      .select({ value: count() })
      .from(todos)
      .where(and(eq(todos.projectId, projectId), eq(todos.completed, true)));
    return result.value;
  }

  findAttachments(projectId: string) {
    return this.db.db
      .select()
      .from(attachments)
      .where(eq(attachments.projectId, projectId))
      .orderBy(asc(attachments.createdAt));
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    if (dto.parentId) {
      await this.assertNotOwnDescendant(id, dto.parentId);
    }

    const [updated] = await this.db.db
      .update(projects)
      .set({
        name: dto.name,
        code: dto.code,
        description: dto.description,
        parentId: dto.parentId,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();

    return updated ?? null;
  }

  archive(id: string, userId: string) {
    return this.setArchivedAt(id, userId, new Date());
  }

  unarchive(id: string, userId: string) {
    return this.setArchivedAt(id, userId, null);
  }

  async remove(id: string, userId: string) {
    const [deleted] = await this.db.db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return deleted ?? null;
  }

  private async setArchivedAt(
    id: string,
    userId: string,
    archivedAt: Date | null,
  ) {
    const project = await this.findOne(id, userId);
    if (!project) return null;

    const ids = await this.collectSubtreeIds(id, userId);

    await this.db.db
      .update(projects)
      .set({ archivedAt, updatedAt: new Date() })
      .where(and(inArray(projects.id, ids), eq(projects.userId, userId)));

    return this.findOne(id, userId);
  }

  private async collectSubtreeIds(id: string, userId: string) {
    const ids = [id];
    let frontier = [id];

    while (frontier.length > 0) {
      const rows = await this.db.db
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            inArray(projects.parentId, frontier),
            eq(projects.userId, userId),
          ),
        );

      frontier = rows.map((row) => row.id).filter((id) => !ids.includes(id));
      ids.push(...frontier);
    }

    return ids;
  }

  private async assertNotOwnDescendant(id: string, parentId: string) {
    let cursor: string | null = parentId;

    while (cursor !== null) {
      const currentId: string = cursor;

      if (currentId === id) {
        throw new BadRequestException(
          'Project tidak bisa dipindah ke dalam dirinya sendiri',
        );
      }

      const [parent] = await this.db.db
        .select({ parentId: projects.parentId })
        .from(projects)
        .where(eq(projects.id, currentId));

      if (!parent) {
        throw new BadRequestException(`Project ${currentId} tidak ditemukan`);
      }

      cursor = parent.parentId;
    }
  }
}
