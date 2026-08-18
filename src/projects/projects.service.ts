import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        parentId: dto.parentId ?? null,
      },
    });
  }

  findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
    });
  }

  findByCode(code: string) {
    return this.prisma.project.findUnique({
      where: { code },
    });
  }

  findChildren(parentId: string) {
    return this.prisma.project.findMany({
      where: { parentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  findLists(projectId: string) {
    return this.prisma.list.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  findTodos(projectId: string) {
    return this.prisma.todo.findMany({
      where: { projectId, parentId: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  countTodos(projectId: string) {
    return this.prisma.todo.count({
      where: { projectId },
    });
  }

  findAttachments(projectId: string) {
    return this.prisma.attachment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    if (dto.parentId) {
      await this.assertNotOwnDescendant(id, dto.parentId);
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        parentId: dto.parentId,
      },
    });
  }

  remove(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
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

      const parent = await this.prisma.project.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!parent) {
        throw new BadRequestException(`Project ${currentId} tidak ditemukan`);
      }

      cursor = parent.parentId;
    }
  }
}
