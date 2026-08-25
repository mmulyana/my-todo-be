import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { todos, lists, projects, attachments } from '@/db/schema';
import { eq, isNull, isNotNull, ilike, or, and, asc } from 'drizzle-orm';
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
      await this.assertCanHaveSubtodo(dto.parentId);
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
    const rows = await this.db.db
      .select()
      .from(todos)
      .where(eq(todos.parentId, parentId));
    return rows.length;
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
      await this.assertCanHaveSubtodo(dto.parentId);
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

  private async assertCanHaveSubtodo(parentId: string) {
    const [parent] = await this.db.db
      .select({ parentId: todos.parentId })
      .from(todos)
      .where(eq(todos.id, parentId));

    if (!parent) {
      throw new BadRequestException(`Todo ${parentId} tidak ditemukan`);
    }

    if (parent.parentId) {
      throw new BadRequestException('Subtodo tidak boleh punya subtodo lagi');
    }
  }
}

