import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import {
  todos,
  lists,
  projects,
  attachments,
  kanbanColumns,
} from '@/db/schema';
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
    this.assertPriority(dto.priority);
    if (dto.parentId) {
      await this.assertParentExists(dto.parentId, userId);
    }

    const projectId = dto.projectId ?? null;
    const kanbanColumnId = await this.firstColumnId(projectId, userId);

    const [todo] = await this.db.db
      .insert(todos)
      .values({
        title: dto.title,
        note: dto.note ?? '',
        important: dto.important ?? false,
        priority: dto.priority ?? 3,
        today: dto.today ?? null,
        dueDate: dto.dueDate ?? null,
        parentId: dto.parentId ?? null,
        listId: dto.listId ?? null,
        projectId,
        kanbanColumnId,
        userId,
        position: await this.nextPosition(userId, projectId, kanbanColumnId),
        listPosition: await this.nextListPosition(
          userId,
          dto.listId ?? null,
          dto.projectId ?? null,
        ),
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
    if (filter.priority !== undefined && filter.priority !== null) {
      this.assertPriority(filter.priority);
      conditions.push(eq(todos.priority, filter.priority));
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
    this.assertPriority(dto.priority);
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          'Todo tidak bisa jadi parent dirinya sendiri',
        );
      }
      await this.assertParentExists(dto.parentId, userId);
      await this.assertNotOwnDescendant(id, dto.parentId);
    }

    const existing = await this.findOne(id, userId);
    if (!existing) return null;

    let kanbanPlacement: {
      kanbanColumnId?: string | null;
      position?: number;
    } = {};
    const projectId = dto.projectId ?? null;
    if (dto.projectId !== undefined && projectId !== existing.projectId) {
      const kanbanColumnId = await this.firstColumnId(projectId, userId);
      kanbanPlacement = {
        kanbanColumnId,
        position: await this.nextPosition(userId, projectId, kanbanColumnId),
      };
    }

    const [updated] = await this.db.db
      .update(todos)
      .set({
        title: dto.title,
        note: dto.note,
        completed: dto.completed,
        important: dto.important,
        priority: dto.priority,
        today: dto.today,
        dueDate: dto.dueDate,
        parentId: dto.parentId,
        listId: dto.listId,
        projectId: dto.projectId,
        ...kanbanPlacement,
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

  async move(
    id: string,
    kanbanColumnId: string,
    position: number,
    userId: string,
  ) {
    if (position < 0)
      throw new BadRequestException('position must be zero or greater');
    return this.db.db.transaction(async (tx) => {
      const [moving] = await tx
        .select()
        .from(todos)
        .where(and(eq(todos.id, id), eq(todos.userId, userId)));
      const [targetColumn] = await tx
        .select()
        .from(kanbanColumns)
        .where(
          and(
            eq(kanbanColumns.id, kanbanColumnId),
            eq(kanbanColumns.userId, userId),
          ),
        );
      if (!moving || moving.parentId) return null;
      if (!targetColumn || moving.projectId !== targetColumn.projectId)
        throw new BadRequestException(
          'Todo and Kanban column must belong to the same project',
        );
      const boardTodos = await tx
        .select()
        .from(todos)
        .where(
          and(
            eq(todos.userId, userId),
            eq(todos.projectId, moving.projectId),
            isNull(todos.parentId),
          ),
        )
        .orderBy(asc(todos.position), asc(todos.createdAt));
      const source = boardTodos.filter(
        (todo) =>
          todo.kanbanColumnId === moving.kanbanColumnId && todo.id !== id,
      );
      const target =
        moving.kanbanColumnId === kanbanColumnId
          ? source
          : boardTodos.filter((todo) => todo.kanbanColumnId === kanbanColumnId);
      target.splice(Math.min(position, target.length), 0, moving);
      for (const group of moving.kanbanColumnId === kanbanColumnId
        ? [target]
        : [source, target]) {
        for (const [nextPosition, todo] of group.entries()) {
          await tx
            .update(todos)
            .set({
              kanbanColumnId:
                todo.id === id ? kanbanColumnId : todo.kanbanColumnId,
              position: nextPosition,
              updatedAt: new Date(),
            })
            .where(eq(todos.id, todo.id));
        }
      }
      const [moved] = await tx.select().from(todos).where(eq(todos.id, id));
      return moved ?? null;
    });
  }

  async moveToList(
    id: string,
    listId: string | null,
    position: number,
    userId: string,
  ) {
    if (position < 0)
      throw new BadRequestException('position must be zero or greater');

    return this.db.db.transaction(async (tx) => {
      const [moving] = await tx
        .select()
        .from(todos)
        .where(and(eq(todos.id, id), eq(todos.userId, userId)));
      if (!moving || moving.parentId) return null;

      if (listId) {
        const [targetList] = await tx
          .select()
          .from(lists)
          .where(and(eq(lists.id, listId), eq(lists.userId, userId)));
        if (!targetList || targetList.projectId !== moving.projectId) {
          throw new BadRequestException('list must belong to the same project');
        }
      }

      const projectCondition = moving.projectId
        ? eq(todos.projectId, moving.projectId)
        : isNull(todos.projectId);
      const scopedTodos = await tx
        .select()
        .from(todos)
        .where(
          and(
            eq(todos.userId, userId),
            isNull(todos.parentId),
            projectCondition,
          ),
        )
        .orderBy(asc(todos.listPosition), asc(todos.createdAt));
      const groupKey = (todo: typeof moving) => todo.listId ?? '__no_list__';
      const groups = new Map<string, typeof scopedTodos>();
      for (const todo of scopedTodos) {
        const key = groupKey(todo);
        groups.set(key, [...(groups.get(key) ?? []), todo]);
      }
      const sourceKey = groupKey(moving);
      const targetKey = listId ?? '__no_list__';
      const source = groups.get(sourceKey)!;
      source.splice(
        source.findIndex((todo) => todo.id === id),
        1,
      );
      const target = groups.get(targetKey) ?? [];
      groups.set(targetKey, target);
      target.splice(Math.min(position, target.length), 0, moving);

      for (const [nextListId, group] of groups) {
        for (const [nextPosition, todo] of group.entries()) {
          const resolvedListId =
            nextListId === '__no_list__' ? null : nextListId;
          if (
            todo.listId === resolvedListId &&
            todo.listPosition === nextPosition
          )
            continue;
          await tx
            .update(todos)
            .set({
              listId: resolvedListId,
              listPosition: nextPosition,
              updatedAt: new Date(),
            })
            .where(and(eq(todos.id, todo.id), eq(todos.userId, userId)));
        }
      }
      const [moved] = await tx
        .select()
        .from(todos)
        .where(and(eq(todos.id, id), eq(todos.userId, userId)));
      return moved ?? null;
    });
  }

  private assertDate(value: string | null | undefined, field: string) {
    if (value && !DATE_FORMAT.test(value)) {
      throw new BadRequestException(`${field} harus format 'yyyy-mm-dd'`);
    }
  }

  private assertPriority(priority: number | null | undefined) {
    if (priority == null) return;
    if (![1, 2, 3].includes(priority)) {
      throw new BadRequestException('priority must be 1, 2, or 3');
    }
  }

  private async nextPosition(
    userId: string,
    projectId: string | null,
    kanbanColumnId: string | null,
  ) {
    const [result] = await this.db.db
      .select({
        position: sql<number>`coalesce(max(${todos.position}), -1) + 1`,
      })
      .from(todos)
      .where(
        and(
          eq(todos.userId, userId),
          isNull(todos.parentId),
          projectId ? eq(todos.projectId, projectId) : isNull(todos.projectId),
          kanbanColumnId
            ? eq(todos.kanbanColumnId, kanbanColumnId)
            : isNull(todos.kanbanColumnId),
        ),
      );
    return Number(result.position);
  }

  private async firstColumnId(projectId: string | null, userId: string) {
    if (!projectId) return null;
    const [column] = await this.db.db
      .select({ id: kanbanColumns.id })
      .from(kanbanColumns)
      .where(
        and(
          eq(kanbanColumns.projectId, projectId),
          eq(kanbanColumns.userId, userId),
        ),
      )
      .orderBy(asc(kanbanColumns.position));
    return column?.id ?? null;
  }

  private async nextListPosition(
    userId: string,
    listId: string | null,
    projectId: string | null,
  ) {
    const listCondition = listId
      ? sql`"listId" = ${listId}`
      : sql`"listId" IS NULL`;
    const projectCondition = projectId
      ? sql`"projectId" = ${projectId}`
      : sql`"projectId" IS NULL`;
    const result = await this.db.db.execute<{ position: number }>(sql`
      SELECT COALESCE(MAX("listPosition"), -1) + 1 AS "position"
      FROM "Todo" WHERE "userId" = ${userId} AND ${listCondition} AND ${projectCondition}
    `);
    return result.rows[0].position;
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
