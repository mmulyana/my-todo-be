import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '@/db/db.service';
import { calendarEvents, todos } from '@/db/schema';
import { eq, and, asc, gt, lt } from 'drizzle-orm';
import { CreateCalendarEventInput } from './dto/create-calendar-event.input';
import { UpdateCalendarEventInput } from './dto/update-calendar-event.input';

@Injectable()
export class CalendarEventsService {
  constructor(private readonly db: DbService) {}

  async findTodo(todoId: string, userId: string) {
    const [todo] = await this.db.db
      .select()
      .from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)));
    return todo ?? null;
  }

  private assertRange(startAt: Date, endAt: Date) {
    if (endAt.getTime() <= startAt.getTime()) {
      throw new BadRequestException('Waktu selesai harus setelah waktu mulai');
    }
  }

  // note: returns every event overlapping [from, to), so multi-day event that started earlier still shows up
  findAll(userId: string, from?: Date | null, to?: Date | null) {
    const conditions = [eq(calendarEvents.userId, userId)];
    if (from) conditions.push(gt(calendarEvents.endAt, from));
    if (to) conditions.push(lt(calendarEvents.startAt, to));
    return this.db.db
      .select()
      .from(calendarEvents)
      .where(and(...conditions))
      .orderBy(asc(calendarEvents.startAt));
  }

  async create(userId: string, input: CreateCalendarEventInput) {
    this.assertRange(input.startAt, input.endAt);

    const todo = input.todoId ? await this.findTodo(input.todoId, userId) : null;
    if (input.todoId && !todo) {
      throw new BadRequestException('Todo tidak ditemukan');
    }

    const title = input.title?.trim() || todo?.title;
    if (!title) throw new BadRequestException('Judul event wajib diisi');

    const [event] = await this.db.db
      .insert(calendarEvents)
      .values({
        title,
        description: input.description?.trim() ?? '',
        startAt: input.startAt,
        endAt: input.endAt,
        allDay: input.allDay ?? false,
        color: input.color ?? null,
        todoId: todo?.id ?? null,
        userId,
      })
      .returning();
    return event;
  }

  async update(userId: string, input: UpdateCalendarEventInput) {
    const [current] = await this.db.db
      .select()
      .from(calendarEvents)
      .where(
        and(eq(calendarEvents.id, input.id), eq(calendarEvents.userId, userId)),
      );
    if (!current) return null;

    if (input.todoId && !(await this.findTodo(input.todoId, userId))) {
      throw new BadRequestException('Todo tidak ditemukan');
    }

    const startAt = input.startAt ?? current.startAt;
    const endAt = input.endAt ?? current.endAt;
    this.assertRange(startAt, endAt);

    if (input.title !== undefined && !input.title?.trim()) {
      throw new BadRequestException('Judul event wajib diisi');
    }

    const [updated] = await this.db.db
      .update(calendarEvents)
      .set({
        title: input.title?.trim(),
        description:
          input.description === undefined
            ? undefined
            : (input.description?.trim() ?? ''),
        startAt,
        endAt,
        allDay: input.allDay ?? undefined,
        color: input.color,
        todoId: input.todoId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(calendarEvents.id, input.id), eq(calendarEvents.userId, userId)),
      )
      .returning();
    return updated ?? null;
  }

  async remove(id: string, userId: string) {
    const [deleted] = await this.db.db
      .delete(calendarEvents)
      .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)))
      .returning();
    return deleted ?? null;
  }
}
