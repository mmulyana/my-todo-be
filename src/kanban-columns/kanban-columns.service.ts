import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { DbService } from '@/db/db.service';
import { kanbanColumns, projects, todos } from '@/db/schema';

@Injectable()
export class KanbanColumnsService {
  constructor(private readonly db: DbService) {}

  findAll(projectId: string, userId: string) {
    return this.db.db
      .select()
      .from(kanbanColumns)
      .where(
        and(
          eq(kanbanColumns.projectId, projectId),
          eq(kanbanColumns.userId, userId),
        ),
      )
      .orderBy(asc(kanbanColumns.position));
  }

  async create(projectId: string, name: string, userId: string) {
    const [project] = await this.db.db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (!project) throw new NotFoundException('Project not found');
    const [column] = await this.db.db
      .insert(kanbanColumns)
      .values({
        projectId,
        userId,
        name: name.trim(),
        position: await this.nextPosition(projectId, userId),
      })
      .returning();
    return column;
  }

  async update(
    id: string,
    input: { name?: string; position?: number },
    userId: string,
  ) {
    const [column] = await this.db.db
      .select()
      .from(kanbanColumns)
      .where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.userId, userId)));
    if (!column) throw new NotFoundException('Kanban column not found');
    if (input.position === undefined) {
      const [updated] = await this.db.db
        .update(kanbanColumns)
        .set({ name: input.name?.trim(), updatedAt: new Date() })
        .where(eq(kanbanColumns.id, id))
        .returning();
      return updated;
    }
    if (input.position < 0)
      throw new BadRequestException('position must be zero or greater');
    const columns = await this.findAll(column.projectId, userId);
    const reordered = columns.filter((item) => item.id !== id);
    reordered.splice(Math.min(input.position, reordered.length), 0, column);
    for (const [position, item] of reordered.entries()) {
      await this.db.db
        .update(kanbanColumns)
        .set({
          position,
          name: item.id === id ? (input.name?.trim() ?? item.name) : item.name,
          updatedAt: new Date(),
        })
        .where(eq(kanbanColumns.id, item.id));
    }
    return reordered.find((item) => item.id === id)!;
  }

  async remove(id: string, userId: string) {
    const [column] = await this.db.db
      .select()
      .from(kanbanColumns)
      .where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.userId, userId)));
    if (!column) throw new NotFoundException('Kanban column not found');
    const [{ count }] = await this.db.db
      .select({ count: sql<number>`count(*)` })
      .from(todos)
      .where(eq(todos.kanbanColumnId, id));
    if (Number(count) > 0)
      throw new BadRequestException(
        'Move all todos before deleting this column',
      );
    const [deleted] = await this.db.db
      .delete(kanbanColumns)
      .where(eq(kanbanColumns.id, id))
      .returning();
    return deleted;
  }

  private async nextPosition(projectId: string, userId: string) {
    const rows = await this.findAll(projectId, userId);
    return rows.length;
  }
}
