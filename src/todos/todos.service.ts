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
      await this.assertParentExists(dto.parentId);
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

    if (filter.completed !== undefined && filter.completed !== null) {
      conditions.push(eq(todos.completed, filter.completed));
    }

    return this.db.db
      .select()
      .from(todos)
      .where(and(...conditions))
      .orderBy(asc(todos.createdAt));
  }

  findSubtodos(parentId: string) {
    return this.db.db
      .select()
      .from(todos)
      .where(eq(todos.parentId, parentId))
      .orderBy(asc(todos.createdAt));
  }

  async countSubtodos(parentId: string) {
    const result = await this.db.db.execute<{ total: number }>(sql`
      WITH RECURSIVE descendants AS (
        SELECT id FROM "Todo" WHERE "parentId" = ${parentId}
        UNION ALL
        SELECT t.id FROM "Todo" t
        INNER JOIN descendants d ON t."parentId" = d.id
      )
      SELECT count(*)::int AS total FROM descendants
    `);
    return result.rows[0].total;
  }

  async countCompletedSubtodos(parentId: string) {
    const result = await this.db.db.execute<{ total: number }>(sql`
      WITH RECURSIVE descendants AS (
        SELECT id, completed FROM "Todo" WHERE "parentId" = ${parentId}
        UNION ALL
        SELECT t.id, t.completed FROM "Todo" t
        INNER JOIN descendants d ON t."parentId" = d.id
      )
      SELECT count(*)::int AS total FROM descendants WHERE completed
    `);
    return result.rows[0].total;
  }

  async findOne(id: string) {
    const [todo] = await this.db.db
      .select()
      .from(todos)
      .where(eq(todos.id, id));
    return todo ?? null;
  }

  async findList(listId: string) {
    const [list] = await this.db.db
      .select()
      .from(lists)
      .where(eq(lists.id, listId));
    return list ?? null;
  }

  async findProject(projectId: string) {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    return project ?? null;
  }

  findAttachments(todoId: string) {
    return this.db.db
      .select()
      .from(attachments)
      .where(eq(attachments.todoId, todoId))
      .orderBy(asc(attachments.createdAt));
  }

  async update(id: string, dto: UpdateTodoDto) {
    this.assertDate(dto.dueDate, 'dueDate');
    this.assertDate(dto.today, 'today');
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          'Todo tidak bisa jadi parent dirinya sendiri',
        );
      }
      await this.assertParentExists(dto.parentId);
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
      .where(eq(todos.id, id))
      .returning();

    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db.db
      .delete(todos)
      .where(eq(todos.id, id))
      .returning();
    return deleted;
  }

  private assertDate(value: string | null | undefined, field: string) {
    if (value && !DATE_FORMAT.test(value)) {
      throw new BadRequestException(`${field} harus format 'yyyy-mm-dd'`);
    }
  }

  private async assertParentExists(parentId: string) {
    const [parent] = await this.db.db
      .select({ id: todos.id })
      .from(todos)
      .where(eq(todos.id, parentId));

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

