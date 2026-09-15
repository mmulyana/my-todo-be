import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { attachments, todos, projects } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { AttachmentType } from './models/attachment.model';
import { LinksService } from '@/links/links.service';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly db: DbService,
    private readonly links: LinksService,
  ) {}

  async create(userId: string, dto: CreateAttachmentDto) {
    if (dto.todoId) {
      const [todoExists] = await this.db.db
        .select()
        .from(todos)
        .where(eq(todos.id, dto.todoId));
      if (!todoExists) {
        throw new NotFoundException(`Todo with ID ${dto.todoId} not found`);
      }
    }

    if (dto.projectId) {
      const [projectExists] = await this.db.db
        .select()
        .from(projects)
        .where(eq(projects.id, dto.projectId));
      if (!projectExists) {
        throw new NotFoundException(
          `Project with ID ${dto.projectId} not found`,
        );
      }
    }

    const type = this.determineType(dto.type, dto.mimeType, dto.url);
    const preview =
      type === AttachmentType.LINK
        ? await this.links.previewOrNull(dto.url)
        : null;

    const [attachment] = await this.db.db
      .insert(attachments)
      .values({
        filename: dto.filename || preview?.title || dto.url,
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size,
        type: type as 'IMAGE' | 'FILE' | 'LINK',
        title: preview?.title ?? null,
        description: preview?.description ?? null,
        image: preview?.image ?? null,
        favicon: preview?.favicon ?? null,
        siteName: preview?.siteName ?? null,
        todoId: dto.todoId ?? null,
        projectId: dto.projectId ?? null,
        userId,
      })
      .returning();

    return attachment;
  }

  findAll(todoId?: string, projectId?: string) {
    const conditions: ReturnType<typeof eq>[] = [];
    if (todoId) conditions.push(eq(attachments.todoId, todoId));
    if (projectId) conditions.push(eq(attachments.projectId, projectId));

    const query = this.db.db
      .select()
      .from(attachments)
      .orderBy(asc(attachments.createdAt));

    return conditions.length > 0
      ? query.where(and(...conditions))
      : query;
  }

  async findOne(id: string) {
    const [attachment] = await this.db.db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id));
    return attachment ?? null;
  }

  findByTodoId(todoId: string) {
    return this.db.db
      .select()
      .from(attachments)
      .where(eq(attachments.todoId, todoId))
      .orderBy(asc(attachments.createdAt));
  }

  findByProjectId(projectId: string) {
    return this.db.db
      .select()
      .from(attachments)
      .where(eq(attachments.projectId, projectId))
      .orderBy(asc(attachments.createdAt));
  }

  async update(id: string, dto: UpdateAttachmentDto) {
    const [attachment] = await this.db.db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id));

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    if (dto.todoId) {
      const [todoExists] = await this.db.db
        .select()
        .from(todos)
        .where(eq(todos.id, dto.todoId));
      if (!todoExists) {
        throw new NotFoundException(`Todo with ID ${dto.todoId} not found`);
      }
    }

    if (dto.projectId) {
      const [projectExists] = await this.db.db
        .select()
        .from(projects)
        .where(eq(projects.id, dto.projectId));
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

    // note: refetch metadata only when the link itself changed.
    const urlChanged = !!dto.url && dto.url !== attachment.url;
    const preview =
      type === AttachmentType.LINK && urlChanged
        ? await this.links.previewOrNull(dto.url!)
        : null;

    const [updated] = await this.db.db
      .update(attachments)
      .set({
        ...(preview
          ? {
              title: preview.title,
              description: preview.description,
              image: preview.image,
              favicon: preview.favicon,
              siteName: preview.siteName,
            }
          : {}),
        filename: dto.filename,
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size,
        type: type as 'IMAGE' | 'FILE' | 'LINK',
        todoId: dto.todoId,
        projectId: dto.projectId,
        updatedAt: new Date(),
      })
      .where(eq(attachments.id, id))
      .returning();

    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.db.db
      .delete(attachments)
      .where(eq(attachments.id, id))
      .returning();
    return deleted;
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
