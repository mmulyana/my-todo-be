import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { todos, lists, projects, attachments } from '@/db/schema';
import { eq, isNull, isNotNull, ilike, or, and, asc, sql } from 'drizzle-orm';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoFilterInput, TodoView } from './dto/todo-filter.input';

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class TodosService {
  constructor(private readonly db: DbService) {}

  async create(userId: string, dto: CreateTodoDto) {
    this.assertDate(dto.dueDate, 'dueDate');
    this.assertDate(dto.today, 'today');
    if (dto.parentId) {
      await this.assertParentExists(dto.parentId, userId);
    }

    const [todo] = await this.db.db
      .insert(todos)
      .values({
        title: dto.title,
        note: dto.note ?? '',
        important: dto.important ?? false,
        today: dto.today ?? null,
        dueDate: dto.dueDate ?? null,
        parentId: dto.parentId ?? null,
        listId: dto.listId ?? null,
        projectId: dto.projectId ?? null,
        userId,
      })
      .returning();

    return todo;
  }

  async findAll(userId: string, filter: TodoFilterInput = {}) {
    const conditions = [isNull(todos.parentId), eq(todos.userId, userId)];

    if (filter.q) {
      // Full-text search overrides other view filters
      conditions.push(
        or(
          ilike(todos.title, `%${filter.q}%`),
          ilike(todos.note, `%${filter.q}%`),
        )!,
      );
    } else {
      switch (filter.view) {
        case TodoView.TODAY:
          conditions.push(isNotNull(todos.today));
          break;
        case TodoView.IMPORTANT:
          conditions.push(eq(todos.important, true));
          break;
        case TodoView.ALL:
        default:
          break;
      }

      if (filter.listId) {
        conditions.push(eq(todos.listId, filter.listId));
      }

      if (filter.projectId) {
        conditions.push(eq(todos.projectId, filter.projectId));
      }
    }

    if (!filter.projectId) {
      conditions.push(
        or(
          isNull(todos.projectId),
          sql`${todos.projectId} NOT IN (
            SELECT ${projects.id} FROM ${projects}
            WHERE ${projects.userId} = ${userId} AND ${projects.archivedAt} IS NOT NULL
          )`,
        )!,
      );
    }

    if (filter.completed !== undefined && filter.completed !== null) {
      conditions.push(eq(todos.completed, filter.completed));
    }

    return this.db.db
      .select()
      .from(todos)
      .where(and(...conditions))
      .orderBy(asc(todos.createdAt));
  }

  findSubtodos(parentId: string, userId: string) {
    return this.db.db
      .select()
      .from(todos)
      .where(and(eq(todos.parentId, parentId), eq(todos.userId, userId)))
      .orderBy(asc(todos.createdAt));
  }

  async countSubtodos(parentId: string, userId: string) {
    const result = await this.db.db.execute<{ total: number }>(sql`
      WITH RECURSIVE descendants AS (
        SELECT id FROM "Todo" WHERE "parentId" = ${parentId} AND "userId" = ${userId}
        UNION ALL
        SELECT t.id FROM "Todo" t
        INNER JOIN descendants d ON t."parentId" = d.id
        WHERE t."userId" = ${userId}
      )
      SELECT count(*)::int AS total FROM descendants
    `);
    return result.rows[0].total;
  }

  async countCompletedSubtodos(parentId: string, userId: string) {
    const result = await this.db.db.execute<{ total: number }>(sql`
      WITH RECURSIVE descendants AS (
        SELECT id, completed FROM "Todo" WHERE "parentId" = ${parentId} AND "userId" = ${userId}
        UNION ALL
        SELECT t.id, t.completed FROM "Todo" t
        INNER JOIN descendants d ON t."parentId" = d.id
        WHERE t."userId" = ${userId}
      )
      SELECT count(*)::int AS total FROM descendants WHERE completed
    `);
    return result.rows[0].total;
  }

  async findOne(id: string, userId: string) {
    const [todo] = await this.db.db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));
    return todo ?? null;
  }

  async findList(listId: string, userId: string) {
    const [list] = await this.db.db
      .select()
      .from(lists)
      .where(and(eq(lists.id, listId), eq(lists.userId, userId)));
    return list ?? null;
  }

  async findProject(projectId: string, userId: string) {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    return project ?? null;
  }

  findAttachments(todoId: string) {
    return this.db.db
      .select()
      .from(attachments)
      .where(eq(attachments.todoId, todoId))
      .orderBy(asc(attachments.createdAt));
  }

  async update(id: string, dto: UpdateTodoDto, userId: string) {
    this.assertDate(dto.dueDate, 'dueDate');
    this.assertDate(dto.today, 'today');
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          'Todo tidak bisa jadi parent dirinya sendiri',
        );
      }
      await this.assertParentExists(dto.parentId, userId);
      await this.assertNotOwnDescendant(id, dto.parentId);
    }

    const [updated] = await this.db.db
      .update(todos)
      .set({
        title: dto.title,
        note: dto.note,
        completed: dto.completed,
        important: dto.important,
        today: dto.today,
        dueDate: dto.dueDate,
        parentId: dto.parentId,
        listId: dto.listId,
        projectId: dto.projectId,
        updatedAt: new Date(),
      })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();

    return updated ?? null;
  }

  async remove(id: string, userId: string) {
    const [deleted] = await this.db.db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();
    return deleted ?? null;
  }

  private assertDate(value: string | null | undefined, field: string) {
    if (value && !DATE_FORMAT.test(value)) {
      throw new BadRequestException(`${field} harus format 'yyyy-mm-dd'`);
    }
  }

  private async assertParentExists(parentId: string, userId: string) {
    const [parent] = await this.db.db
      .select({ id: todos.id })
      .from(todos)
      .where(and(eq(todos.id, parentId), eq(todos.userId, userId)));

    if (!parent) {
      throw new BadRequestException(`Todo ${parentId} tidak ditemukan`);
    }
  }

  private async assertNotOwnDescendant(id: string, newParentId: string) {
    let cursor: string | null = newParentId;

    while (cursor !== null) {
      const currentId: string = cursor;

      if (currentId === id) {
        throw new BadRequestException(
          'Todo tidak bisa dipindah ke dalam turunannya sendiri',
        );
      }

      const [parent] = await this.db.db
        .select({ parentId: todos.parentId })
        .from(todos)
        .where(eq(todos.id, currentId));

      if (!parent) {
        throw new BadRequestException(`Todo ${currentId} tidak ditemukan`);
      }

      cursor = parent.parentId;
    }
  }
}
