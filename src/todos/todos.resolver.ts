import { BadRequestException } from '@nestjs/common';
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
import { List } from '@/lists/models/list.model';
import { Project } from '@/projects/models/project.model';
import { Attachment } from '@/attachments/models/attachment.model';

interface ResolvedTodo extends Todo {
  isSubtodo?: boolean;
}

@Resolver(() => Todo)
export class TodosResolver {
  constructor(private readonly todosService: TodosService) {}

  @ResolveField(() => [Attachment])
  attachments(@Parent() todo: Todo) {
    return this.todosService.findAttachments(todo.id);
  }

  @ResolveField(() => [Todo])
  async subtodos(@Parent() todo: ResolvedTodo) {
    if (todo.isSubtodo) {
      throw new BadRequestException(
        'subtodos can only be queried one level deep. Fetch deeper levels with todo(id)',
      );
    }

    const subtodos = await this.todosService.findSubtodos(todo.id);
    return subtodos.map((subtodo) => ({ ...subtodo, isSubtodo: true }));
  }

  @ResolveField(() => Int)
  subtodoCount(@Parent() todo: Todo) {
    return this.todosService.countSubtodos(todo.id);
  }

  @ResolveField(() => Todo, { nullable: true })
  parent(@Parent() todo: Todo) {
    if (!todo.parentId) {
      return null;
    }
    return this.todosService.findOne(todo.parentId);
  }

  @ResolveField(() => List, { nullable: true })
  list(@Parent() todo: Todo) {
    if (!todo.listId) {
      return null;
    }
    return this.todosService.findList(todo.listId);
  }

  @ResolveField(() => Project, { nullable: true })
  project(@Parent() todo: Todo) {
    if (!todo.projectId) {
      return null;
    }
    return this.todosService.findProject(todo.projectId);
  }

  @Query(() => [Todo], { name: 'todos' })
  findAll(
    @Args('filter', { type: () => TodoFilterInput, nullable: true })
    filter?: TodoFilterInput,
  ) {
    return this.todosService.findAll(filter);
  }

  @Query(() => Todo, { name: 'todo', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.todosService.findOne(id);
  }

  @Mutation(() => Todo)
  createTodo(@Args('input') input: CreateTodoInput) {
    return this.todosService.create(input);
  }

  @Mutation(() => Todo)
  updateTodo(@Args('input') input: UpdateTodoInput) {
    return this.todosService.update(input.id, input);
  }

  @Mutation(() => Todo)
  removeTodo(@Args('id', { type: () => ID }) id: string) {
    return this.todosService.remove(id);
  }
}
