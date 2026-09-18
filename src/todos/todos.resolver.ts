import { BadRequestException, UseGuards } from '@nestjs/common';
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
import { TodosService } from './todos.service';
import { Todo } from './models/todo.model';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';
import { TodoFilterInput } from './dto/todo-filter.input';
import { MoveTodoInput } from './dto/move-todo.input';
import { MoveTodoToListInput } from './dto/move-todo-to-list.input';
import { List } from '@/lists/models/list.model';
import { Project } from '@/projects/models/project.model';
import { Attachment } from '@/attachments/models/attachment.model';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

// Batas kedalaman nested `subtodos` yang boleh diminta dalam satu query
const MAX_NESTED_SUBTODOS_DEPTH = 1;

interface ResolvedTodo extends Todo {
  subtodoDepth?: number;
}

@Resolver(() => Todo)
@UseGuards(JwtAuthGuard)
export class TodosResolver {
  constructor(private readonly todosService: TodosService) {}

  @ResolveField(() => [Attachment])
  attachments(@Parent() todo: Todo) {
    return this.todosService.findAttachments(todo.id);
  }

  @ResolveField(() => [Todo])
  async subtodos(
    @Parent() todo: ResolvedTodo,
    @CurrentUser() user: { userId: string },
  ) {
    const depth = (todo.subtodoDepth ?? 0) + 1;

    if (depth > MAX_NESTED_SUBTODOS_DEPTH) {
      throw new BadRequestException(
        `subtodos can only be nested ${MAX_NESTED_SUBTODOS_DEPTH} levels deep in one query. Fetch deeper levels with todo(id)`,
      );
    }

    const subtodos = await this.todosService.findSubtodos(todo.id, user.userId);
    return subtodos.map((subtodo) => ({ ...subtodo, subtodoDepth: depth }));
  }

  @ResolveField(() => Int)
  subtodoCount(@Parent() todo: Todo, @CurrentUser() user: { userId: string }) {
    return this.todosService.countSubtodos(todo.id, user.userId);
  }

  @ResolveField(() => Int)
  completedTodos(
    @Parent() todo: Todo,
    @CurrentUser() user: { userId: string },
  ) {
    return this.todosService.countCompletedSubtodos(todo.id, user.userId);
  }

  @ResolveField(() => Todo, { nullable: true })
  parent(@Parent() todo: Todo, @CurrentUser() user: { userId: string }) {
    if (!todo.parentId) {
      return null;
    }
    return this.todosService.findOne(todo.parentId, user.userId);
  }

  @ResolveField(() => List, { nullable: true })
  list(@Parent() todo: Todo, @CurrentUser() user: { userId: string }) {
    if (!todo.listId) {
      return null;
    }
    return this.todosService.findList(todo.listId, user.userId);
  }

  @ResolveField(() => Project, { nullable: true })
  project(@Parent() todo: Todo, @CurrentUser() user: { userId: string }) {
    if (!todo.projectId) {
      return null;
    }
    return this.todosService.findProject(todo.projectId, user.userId);
  }

  @Query(() => [Todo], { name: 'todos' })
  findAll(
    @CurrentUser() user: { userId: string },
    @Args('filter', { type: () => TodoFilterInput, nullable: true })
    filter?: TodoFilterInput,
  ) {
    return this.todosService.findAll(user.userId, filter);
  }

  @Query(() => Todo, { name: 'todo', nullable: true })
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.todosService.findOne(id, user.userId);
  }

  @Mutation(() => Todo)
  createTodo(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateTodoInput,
  ) {
    return this.todosService.create(user.userId, input);
  }

  @Mutation(() => Todo)
  updateTodo(
    @Args('input') input: UpdateTodoInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.todosService.update(input.id, input, user.userId);
  }

  @Mutation(() => Todo, { nullable: true })
  moveTodo(
    @Args('input') input: MoveTodoInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.todosService.move(
      input.id,
      input.kanbanColumnId,
      input.position,
      user.userId,
    );
  }

  @Mutation(() => Todo, { nullable: true })
  moveTodoToList(
    @Args('input') input: MoveTodoToListInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.todosService.moveToList(
      input.id,
      input.listId ?? null,
      input.position,
      user.userId,
    );
  }

  @Mutation(() => Todo)
  removeTodo(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.todosService.remove(id, user.userId);
  }
}
