import { UseGuards } from '@nestjs/common';
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntry } from './models/time-entry.model';
import { StartTimeEntryInput } from './dto/start-time-entry.input';
import { UpdateTimeEntryInput } from './dto/update-time-entry.input';
import { Todo } from '@/todos/models/todo.model';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { TimeEntry as TimeEntryRow } from '@/db/schema';

@Resolver(() => TimeEntry)
@UseGuards(JwtAuthGuard)
export class TimeEntriesResolver {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @ResolveField(() => Todo, { nullable: true })
  todo(@Parent() entry: TimeEntryRow, @CurrentUser() user: { userId: string }) {
    if (!entry.todoId) {
      return null;
    }
    return this.timeEntriesService.findTodo(entry.todoId, user.userId);
  }

  @ResolveField(() => Int)
  duration(@Parent() entry: TimeEntryRow) {
    return this.timeEntriesService.duration(entry);
  }

  @Query(() => [TimeEntry], { name: 'timeEntries' })
  findAll(
    @CurrentUser() user: { userId: string },
    @Args('from', { type: () => Date, nullable: true }) from?: Date | null,
    @Args('to', { type: () => Date, nullable: true }) to?: Date | null,
  ) {
    return this.timeEntriesService.findAll(user.userId, from, to);
  }

  @Query(() => TimeEntry, { name: 'runningTimeEntry', nullable: true })
  findRunning(@CurrentUser() user: { userId: string }) {
    return this.timeEntriesService.findRunning(user.userId);
  }

  @Mutation(() => TimeEntry)
  startTimeEntry(
    @CurrentUser() user: { userId: string },
    @Args('input', { type: () => StartTimeEntryInput, nullable: true })
    input?: StartTimeEntryInput,
  ) {
    return this.timeEntriesService.start(user.userId, input ?? {});
  }

  @Mutation(() => TimeEntry, { nullable: true })
  stopTimeEntry(@CurrentUser() user: { userId: string }) {
    return this.timeEntriesService.stop(user.userId);
  }

  @Mutation(() => TimeEntry, { nullable: true })
  updateTimeEntry(
    @CurrentUser() user: { userId: string },
    @Args('input') input: UpdateTimeEntryInput,
  ) {
    return this.timeEntriesService.update(user.userId, input);
  }

  @Mutation(() => TimeEntry, { nullable: true })
  removeTimeEntry(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.timeEntriesService.remove(id, user.userId);
  }
}
