import { Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { documents, projects } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly db: DbService) {}

  async create(userId: string, dto: CreateDocumentDto) {
    const [document] = await this.db.db
      .insert(documents)
      .values({
        title: dto.title,
        content: dto.content ?? null,
        projectId: dto.projectId ?? null,
        userId,
      })
      .returning();
    return document;
  }

  findAll(userId: string, projectId?: string) {
    return this.db.db
      .select()
      .from(documents)
      .where(
        projectId
          ? and(eq(documents.userId, userId), eq(documents.projectId, projectId))
          : eq(documents.userId, userId),
      )
      .orderBy(desc(documents.updatedAt));
  }

  async findOne(id: string, userId: string) {
    const [document] = await this.db.db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
    return document ?? null;
  }

  async findProject(projectId: string) {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    return project ?? null;
  }

  async update(id: string, dto: UpdateDocumentDto, userId: string) {
    const [updated] = await this.db.db
      .update(documents)
      .set({
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async remove(id: string, userId: string) {
    const [deleted] = await this.db.db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .returning();
    return deleted ?? null;
  }
}
