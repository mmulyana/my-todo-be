import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { AttachmentType } from './models/attachment.model';

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAttachmentDto) {
    if (dto.todoId) {
      const todoExists = await this.prisma.todo.findUnique({
        where: { id: dto.todoId },
      });
      if (!todoExists) {
        throw new NotFoundException(`Todo with ID ${dto.todoId} not found`);
      }
    }

    if (dto.projectId) {
      const projectExists = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });
      if (!projectExists) {
        throw new NotFoundException(
          `Project with ID ${dto.projectId} not found`,
        );
      }
    }

    const type = this.determineType(dto.type, dto.mimeType, dto.url);

    return this.prisma.attachment.create({
      data: {
        filename: dto.filename,
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size,
        type: type as any,
        todoId: dto.todoId ?? null,
        projectId: dto.projectId ?? null,
      },
    });
  }

  findAll(todoId?: string, projectId?: string) {
    return this.prisma.attachment.findMany({
      where: {
        ...(todoId ? { todoId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.attachment.findUnique({
      where: { id },
    });
  }

  findByTodoId(todoId: string) {
    return this.prisma.attachment.findMany({
      where: { todoId },
      orderBy: { createdAt: 'asc' },
    });
  }

  findByProjectId(projectId: string) {
    return this.prisma.attachment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, dto: UpdateAttachmentDto) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    if (dto.todoId) {
      const todoExists = await this.prisma.todo.findUnique({
        where: { id: dto.todoId },
      });
      if (!todoExists) {
        throw new NotFoundException(`Todo with ID ${dto.todoId} not found`);
      }
    }

    if (dto.projectId) {
      const projectExists = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });
      if (!projectExists) {
        throw new NotFoundException(
          `Project with ID ${dto.projectId} not found`,
        );
      }
    }

    const type = dto.type
      ? dto.type
      : dto.url || dto.mimeType
        ? this.determineType(
            undefined,
            dto.mimeType ?? attachment.mimeType ?? undefined,
            dto.url ?? attachment.url,
          )
        : attachment.type;

    return this.prisma.attachment.update({
      where: { id },
      data: {
        filename: dto.filename,
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size,
        type: type as any,
        todoId: dto.todoId,
        projectId: dto.projectId,
      },
    });
  }

  remove(id: string) {
    return this.prisma.attachment.delete({
      where: { id },
    });
  }

  private determineType(
    explicitType?: AttachmentType,
    mimeType?: string,
    url?: string,
  ): AttachmentType {
    if (explicitType) {
      return explicitType;
    }

    if (mimeType && mimeType.startsWith('image/')) {
      return AttachmentType.IMAGE;
    }

    if (url) {
      const lowerUrl = url.toLowerCase();
      if (
        lowerUrl.endsWith('.png') ||
        lowerUrl.endsWith('.jpg') ||
        lowerUrl.endsWith('.jpeg') ||
        lowerUrl.endsWith('.gif') ||
        lowerUrl.endsWith('.webp') ||
        lowerUrl.endsWith('.svg')
      ) {
        return AttachmentType.IMAGE;
      }
      if (
        (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) &&
        !lowerUrl.includes('/uploads/')
      ) {
        return AttachmentType.LINK;
      }
    }

    return AttachmentType.FILE;
  }
}
