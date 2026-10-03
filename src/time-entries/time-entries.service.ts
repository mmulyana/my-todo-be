import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { timeEntries, todos, TimeEntry } from '@/db/schema';
import { eq, and, desc, gte, lt, isNull } from 'drizzle-orm';
import { StartTimeEntryInput } from './dto/start-time-entry.input';
import { UpdateTimeEntryInput } from './dto/update-time-entry.input';

@Injectable()
export class TimeEntriesService {
  constructor(private readonly db: DbService) {}

  private async assertTodo(todoId: string | null | undefined, userId: string) {
    if (!todoId) return;
    const [todo] = await this.db.db
      .select({ id: todos.id })
      .from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)));
    if (!todo) throw new BadRequestException('Todo tidak ditemukan');
  }

  duration(entry: TimeEntry) {
    const end = entry.endedAt ?? new Date();
    return Math.max(
      0,
      Math.floor((end.getTime() - entry.startedAt.getTime()) / 1000),
    );
  }

  findAll(userId: string, from?: Date | null, to?: Date | null) {
    const conditions = [eq(timeEntries.userId, userId)];
    if (from) conditions.push(gte(timeEntries.startedAt, from));
    if (to) conditions.push(lt(timeEntries.startedAt, to));
    return this.db.db
      .select()
      .from(timeEntries)
      .where(and(...conditions))
      .orderBy(desc(timeEntries.startedAt));
  }

  async findRunning(userId: string) {
    const [entry] = await this.db.db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endedAt)))
      .orderBy(desc(timeEntries.startedAt))
      .limit(1);
    return entry ?? null;
  }

  async findTodo(todoId: string, userId: string) {
    const [todo] = await this.db.db
      .select()
      .from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)));
    return todo ?? null;
  }

  async start(userId: string, input: StartTimeEntryInput) {
    await this.assertTodo(input.todoId, userId);
    const now = new Date();

    return this.db.db.transaction(async (tx) => {
      // note: only one timer can run, the previous one is stopped automatically
      await tx
        .update(timeEntries)
        .set({ endedAt: now, updatedAt: now })
        .where(
          and(eq(timeEntries.userId, userId), isNull(timeEntries.endedAt)),
        );

      const [entry] = await tx
        .insert(timeEntries)
        .values({
          description: input.description?.trim() ?? '',
          todoId: input.todoId ?? null,
          startedAt: now,
          userId,
        })
        .returning();
      return entry;
    });
  }

  async stop(userId: string) {
    const now = new Date();
    const [entry] = await this.db.db
      .update(timeEntries)
      .set({ endedAt: now, updatedAt: now })
      .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endedAt)))
      .returning();
    return entry ?? null;
  }

  async update(userId: string, input: UpdateTimeEntryInput) {
    const [current] = await this.db.db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.id, input.id), eq(timeEntries.userId, userId)));
    if (!current) return null;

    if (input.todoId !== undefined) await this.assertTodo(input.todoId, userId);

    const startedAt = input.startedAt ?? current.startedAt;
    // note: a null endedAt from the client is ignored so a finished entry never runs again
    const endedAt = input.endedAt ?? current.endedAt;
    if (endedAt && endedAt.getTime() < startedAt.getTime()) {
      throw new BadRequestException('Waktu selesai harus setelah waktu mulai');
    }

    const [updated] = await this.db.db
      .update(timeEntries)
      .set({
        todoId: input.todoId,
        description:
          input.description === undefined
            ? undefined
            : (input.description?.trim() ?? ''),
        startedAt,
        endedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(timeEntries.id, input.id), eq(timeEntries.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async remove(id: string, userId: string) {
    const [deleted] = await this.db.db
      .delete(timeEntries)
      .where(and(eq(timeEntries.id, id), eq(timeEntries.userId, userId)))
      .returning();
    return deleted ?? null;
  }
}
