import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { KanbanColumn } from './models/kanban-column.model';
import {
  CreateKanbanColumnInput,
  UpdateKanbanColumnInput,
} from './dto/kanban-column.input';
import { KanbanColumnsService } from './kanban-columns.service';

@Resolver(() => KanbanColumn)
@UseGuards(JwtAuthGuard)
export class KanbanColumnsResolver {
  constructor(private readonly service: KanbanColumnsService) {}
  @Query(() => [KanbanColumn]) kanbanColumns(
    @Args('projectId', { type: () => ID }) projectId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.findAll(projectId, user.userId);
  }
  @Mutation(() => KanbanColumn) createKanbanColumn(
    @Args('input') input: CreateKanbanColumnInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.create(input.projectId, input.name, user.userId);
  }
  @Mutation(() => KanbanColumn) updateKanbanColumn(
    @Args('input') input: UpdateKanbanColumnInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.update(input.id, input, user.userId);
  }
  @Mutation(() => KanbanColumn) removeKanbanColumn(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.remove(id, user.userId);
  }
}
