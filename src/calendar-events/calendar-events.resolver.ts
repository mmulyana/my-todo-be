import { UseGuards } from '@nestjs/common';
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { CalendarEventsService } from './calendar-events.service';
import { CalendarEvent } from './models/calendar-event.model';
import { CreateCalendarEventInput } from './dto/create-calendar-event.input';
import { UpdateCalendarEventInput } from './dto/update-calendar-event.input';
import { Todo } from '@/todos/models/todo.model';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { CalendarEvent as CalendarEventRow } from '@/db/schema';

@Resolver(() => CalendarEvent)
@UseGuards(JwtAuthGuard)
export class CalendarEventsResolver {
  constructor(private readonly calendarEventsService: CalendarEventsService) {}

  @ResolveField(() => Todo, { nullable: true })
  todo(
    @Parent() event: CalendarEventRow,
    @CurrentUser() user: { userId: string },
  ) {
    if (!event.todoId) {
      return null;
    }
    return this.calendarEventsService.findTodo(event.todoId, user.userId);
  }

  @Query(() => [CalendarEvent], {
    name: 'calendarEvents',
    description: 'Events overlapping the [from, to) range',
  })
  findAll(
    @CurrentUser() user: { userId: string },
    @Args('from', { type: () => Date, nullable: true }) from?: Date | null,
    @Args('to', { type: () => Date, nullable: true }) to?: Date | null,
  ) {
    return this.calendarEventsService.findAll(user.userId, from, to);
  }

  @Mutation(() => CalendarEvent)
  createCalendarEvent(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateCalendarEventInput,
  ) {
    return this.calendarEventsService.create(user.userId, input);
  }

  @Mutation(() => CalendarEvent, { nullable: true })
  updateCalendarEvent(
    @CurrentUser() user: { userId: string },
    @Args('input') input: UpdateCalendarEventInput,
  ) {
    return this.calendarEventsService.update(user.userId, input);
  }

  @Mutation(() => CalendarEvent, { nullable: true })
  removeCalendarEvent(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.calendarEventsService.remove(id, user.userId);
  }
}
