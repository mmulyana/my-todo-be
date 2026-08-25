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
import { ListsService } from './lists.service';
import { List } from './models/list.model';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { Todo } from '@/todos/models/todo.model';
import { Project } from '@/projects/models/project.model';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Resolver(() => List)
@UseGuards(JwtAuthGuard)
export class ListsResolver {
  constructor(private readonly listsService: ListsService) {}

  @ResolveField(() => Project, { nullable: true })
  project(@Parent() list: List) {
    if (!list.projectId) {
      return null;
    }
    return this.listsService.findProject(list.projectId);
  }

  @ResolveField(() => [Todo])
  todos(@Parent() list: List) {
    return this.listsService.findTodos(list.id);
  }

  @Query(() => [List], { name: 'lists' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.listsService.findAll(user.userId);
  }

  @Query(() => List, { name: 'list', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.listsService.findOne(id);
  }

  @Mutation(() => List)
  createList(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateListInput,
  ) {
    return this.listsService.create(user.userId, input);
  }

  @Mutation(() => List)
  updateList(@Args('input') input: UpdateListInput) {
    return this.listsService.update(input.id, input);
  }

  @Mutation(() => List)
  removeList(@Args('id', { type: () => ID }) id: string) {
    return this.listsService.remove(id);
  }
}

