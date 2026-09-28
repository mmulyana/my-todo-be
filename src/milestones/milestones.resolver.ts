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
import { MilestonesService } from './milestones.service';
import { Milestone } from './models/milestone.model';
import { CreateMilestoneInput } from './dto/create-milestone.input';
import { UpdateMilestoneInput } from './dto/update-milestone.input';
import { Todo } from '@/todos/models/todo.model';
import { Project } from '@/projects/models/project.model';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Resolver(() => Milestone)
@UseGuards(JwtAuthGuard)
export class MilestonesResolver {
  constructor(private readonly milestonesService: MilestonesService) {}

  @ResolveField(() => Project, { nullable: true })
  project(@Parent() milestone: Milestone) {
    if (!milestone.projectId) {
      return null;
    }
    return this.milestonesService.findProject(milestone.projectId);
  }

  @ResolveField(() => [Todo])
  todos(
    @Parent() milestone: Milestone,
    @CurrentUser() user: { userId: string },
  ) {
    return this.milestonesService.findTodos(milestone.id, user.userId);
  }

  @ResolveField(() => Int)
  totalTodo(@Parent() milestone: Milestone) {
    return this.milestonesService.countTodos(milestone.id);
  }

  @ResolveField(() => Int)
  completedTodos(@Parent() milestone: Milestone) {
    return this.milestonesService.countCompletedTodos(milestone.id);
  }

  @Query(() => [Milestone], { name: 'milestones' })
  findAll(
    @CurrentUser() user: { userId: string },
    @Args('projectId', { type: () => ID, nullable: true }) projectId?: string,
  ) {
    return this.milestonesService.findAll(user.userId, projectId);
  }

  @Query(() => Milestone, { name: 'milestone', nullable: true })
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.milestonesService.findOne(id, user.userId);
  }

  @Mutation(() => Milestone)
  createMilestone(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateMilestoneInput,
  ) {
    return this.milestonesService.create(user.userId, input);
  }

  @Mutation(() => Milestone)
  updateMilestone(
    @Args('input') input: UpdateMilestoneInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.milestonesService.update(input.id, input, user.userId);
  }

  @Mutation(() => Milestone)
  removeMilestone(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.milestonesService.remove(id, user.userId);
  }
}
