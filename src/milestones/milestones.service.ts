import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { milestones, projects, todos } from '@/db/schema';
import { eq, and, asc, count, sql } from 'drizzle-orm';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class MilestonesService {
  constructor(private readonly db: DbService) {}

  private assertDate(value: string | null | undefined) {
    if (value && !DATE_FORMAT.test(value)) {
      throw new BadRequestException("dueDate harus format 'yyyy-mm-dd'");
    }
  }

  private async nextPosition(projectId: string | null) {
    const [result] = await this.db.db
      .select({
        position: sql<number>`coalesce(max(${milestones.position}), -1) + 1`,
      })
      .from(milestones)
      .where(
        projectId
          ? eq(milestones.projectId, projectId)
          : sql`${milestones.projectId} IS NULL`,
      );
    return Number(result.position);
  }

  async create(userId: string, dto: CreateMilestoneDto) {
    this.assertDate(dto.dueDate);
    const projectId = dto.projectId ?? null;
    const [milestone] = await this.db.db
      .insert(milestones)
      .values({
        name: dto.name,
        description: dto.description ?? null,
        dueDate: dto.dueDate ?? null,
        projectId,
        userId,
        position: await this.nextPosition(projectId),
      })
      .returning();
    return milestone;
  }

  findAll(userId: string, projectId?: string) {
    const conditions = [eq(milestones.userId, userId)];
    if (projectId) conditions.push(eq(milestones.projectId, projectId));
    return this.db.db
      .select()
      .from(milestones)
      .where(and(...conditions))
      .orderBy(asc(milestones.position), asc(milestones.createdAt));
  }

  async findOne(id: string, userId: string) {
    const [milestone] = await this.db.db
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, id), eq(milestones.userId, userId)));
    return milestone ?? null;
  }

  async findProject(projectId: string) {
    const [project] = await this.db.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    return project ?? null;
  }

  findTodos(milestoneId: string, userId: string) {
    return this.db.db
      .select()
      .from(todos)
      .where(and(eq(todos.milestoneId, milestoneId), eq(todos.userId, userId)))
      .orderBy(asc(todos.createdAt));
  }

  async countTodos(milestoneId: string) {
    const [result] = await this.db.db
      .select({ value: count() })
      .from(todos)
      .where(eq(todos.milestoneId, milestoneId));
    return result.value;
  }

  async countCompletedTodos(milestoneId: string) {
    const [result] = await this.db.db
      .select({ value: count() })
      .from(todos)
      .where(
        and(eq(todos.milestoneId, milestoneId), eq(todos.completed, true)),
      );
    return result.value;
  }

  async update(id: string, dto: UpdateMilestoneDto, userId: string) {
    this.assertDate(dto.dueDate);
    const [updated] = await this.db.db
      .update(milestones)
      .set({
        name: dto.name,
        description: dto.description,
        dueDate: dto.dueDate,
        projectId: dto.projectId,
        updatedAt: new Date(),
      })
      .where(and(eq(milestones.id, id), eq(milestones.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async remove(id: string, userId: string) {
    const [deleted] = await this.db.db
      .delete(milestones)
      .where(and(eq(milestones.id, id), eq(milestones.userId, userId)))
      .returning();
    return deleted ?? null;
  }
}
