import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@generated/prisma/client';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoFilterInput, TodoView } from './dto/todo-filter.input';

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTodoDto) {
    this.assertDate(dto.dueDate, 'dueDate');
    this.assertDate(dto.today, 'today');
    if (dto.parentId) {
      await this.assertCanHaveSubtodo(dto.parentId);
    }

    return this.prisma.todo.create({
      data: {
        title: dto.title,
        note: dto.note ?? '',
        important: dto.important ?? false,
        today: dto.today ?? null,
        dueDate: dto.dueDate ?? null,
        parentId: dto.parentId ?? null,
        listId: dto.listId ?? null,
        projectId: dto.projectId ?? null,
      },
    });
  }

  findAll(filter: TodoFilterInput = {}) {
    const where: Prisma.TodoWhereInput = { parentId: null };

    switch (filter.view) {
      case TodoView.TODAY:
        where.today = { not: null };
        break;
      case TodoView.IMPORTANT:
        where.important = true;
        break;
      case TodoView.ALL:
      default:
        break;
    }

    if (filter.listId) {
      where.listId = filter.listId;
    }

    if (filter.projectId) {
      where.projectId = filter.projectId;
    }

    if (filter.q) {
      delete where.listId;
      delete where.today;
      delete where.important;
      where.OR = [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { note: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.todo.findMany({ where, orderBy: { createdAt: 'asc' } });
  }

  findSubtodos(parentId: string) {
    return this.prisma.todo.findMany({
      where: { parentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  countSubtodos(parentId: string) {
    return this.prisma.todo.count({ where: { parentId } });
  }

  findOne(id: string) {
    return this.prisma.todo.findUnique({
      where: { id },
    });
  }

  findList(listId: string) {
    return this.prisma.list.findUnique({
      where: { id: listId },
    });
  }

  findProject(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
    });
  }

  findAttachments(todoId: string) {
    return this.prisma.attachment.findMany({
      where: { todoId },
      orderBy: { createdAt: 'asc' },
    });
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

    return this.prisma.todo.update({
      where: { id },
      data: {
        title: dto.title,
        note: dto.note,
        completed: dto.completed,
        important: dto.important,
        today: dto.today,
        dueDate: dto.dueDate,
        parentId: dto.parentId,
        listId: dto.listId,
        projectId: dto.projectId,
      },
    });
  }

  remove(id: string) {
    return this.prisma.todo.delete({
      where: { id },
    });
  }

  private assertDate(value: string | null | undefined, field: string) {
    if (value && !DATE_FORMAT.test(value)) {
      throw new BadRequestException(`${field} harus format 'yyyy-mm-dd'`);
    }
  }

  private async assertCanHaveSubtodo(parentId: string) {
    const parent = await this.prisma.todo.findUnique({
      where: { id: parentId },
      select: { parentId: true },
    });

    if (!parent) {
      throw new BadRequestException(`Todo ${parentId} tidak ditemukan`);
    }

    if (parent.parentId) {
      throw new BadRequestException('Subtodo tidak boleh punya subtodo lagi');
    }
  }
}
