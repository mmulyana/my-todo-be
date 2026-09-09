import { Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { lists, projects, todos } from '@/db/schema';
import { eq, and, asc, count } from 'drizzle-orm';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';

@Injectable()
export class ListsService {
  constructor(private readonly db: DbService) {}

  async create(userId: string, dto: CreateListDto) {
    const [list] = await this.db.db
      .insert(lists)
      .values({
        name: dto.name,
        projectId: dto.projectId ?? null,
        userId,
      })
      .returning();
    return list;
  }

  findAll(userId: string) {
    return this.db.db
      .select()
      .from(lists)
      .where(eq(lists.userId, userId))
      .orderBy(asc(lists.createdAt));
  }

  async findOne(id: string, userId: string) {
    const [list] = await this.db.db
      .select()
      .from(lists)
      .where(and(eq(lists.id, id), eq(lists.userId, userId)));
    return list ?? null;
  }

  async findProject(projectId: string) {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    return project ?? null;
  }

  findTodos(listId: string, userId: string) {
    return this.db.db
      .select()
      .from(todos)
      .where(and(eq(todos.listId, listId), eq(todos.userId, userId)))
      .orderBy(asc(todos.createdAt));
  }

  async countTodos(listId: string) {
    const [result] = await this.db.db
      .select({ value: count() })
      .from(todos)
      .where(eq(todos.listId, listId));
    return result.value;
  }

  async countCompletedTodos(listId: string) {
    const [result] = await this.db.db
      .select({ value: count() })
      .from(todos)
      .where(and(eq(todos.listId, listId), eq(todos.completed, true)));
    return result.value;
  }

  async update(id: string, dto: UpdateListDto, userId: string) {
    const [updated] = await this.db.db
      .update(lists)
      .set({
        name: dto.name,
        projectId: dto.projectId,
        updatedAt: new Date(),
      })
      .where(and(eq(lists.id, id), eq(lists.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async remove(id: string, userId: string) {
    const [deleted] = await this.db.db
      .delete(lists)
      .where(and(eq(lists.id, id), eq(lists.userId, userId)))
      .returning();
    return deleted ?? null;
  }
}
