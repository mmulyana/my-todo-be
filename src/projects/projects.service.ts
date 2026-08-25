import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { projects, lists, todos, attachments } from '@/db/schema';
import { eq, isNull, and, asc } from 'drizzle-orm';
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

  findAll(userId: string) {
    return this.db.db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(asc(projects.createdAt));
  }

  async findOne(id: string) {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project ?? null;
  }

  async findByCode(code: string) {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(eq(projects.code, code));
    return project ?? null;
  }

  findChildren(parentId: string) {
    return this.db.db
      .select()
      .from(projects)
      .where(eq(projects.parentId, parentId))
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

  async countTodos(projectId: string) {
    const rows = await this.db.db
      .select()
      .from(todos)
      .where(eq(todos.projectId, projectId));
    return rows.length;
  }

  findAttachments(projectId: string) {
    return this.db.db
      .select()
      .from(attachments)
      .where(eq(attachments.projectId, projectId))
      .orderBy(asc(attachments.createdAt));
  }

  async update(id: string, dto: UpdateProjectDto) {
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
      .where(eq(projects.id, id))
      .returning();

    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db.db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    return deleted;
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
