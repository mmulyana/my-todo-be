import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';

@Injectable()
export class ListsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateListDto) {
    return this.prisma.list.create({
      data: {
        name: dto.name,
        projectId: dto.projectId ?? null,
      },
    });
  }

  findAll() {
    return this.prisma.list.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.list.findUnique({
      where: { id },
    });
  }

  findProject(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
    });
  }

  findTodos(listId: string) {
    return this.prisma.todo.findMany({
      where: { listId, parentId: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  update(id: string, dto: UpdateListDto) {
    return this.prisma.list.update({
      where: { id },
      data: {
        name: dto.name,
        projectId: dto.projectId,
      },
    });
  }

  remove(id: string) {
    return this.prisma.list.delete({
      where: { id },
    });
  }
}
