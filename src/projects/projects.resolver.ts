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
import { ProjectsService } from './projects.service';
import { Project } from './models/project.model';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { Todo } from '@/todos/models/todo.model';
import { List } from '@/lists/models/list.model';
import { Attachment } from '@/attachments/models/attachment.model';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Resolver(() => Project)
@UseGuards(JwtAuthGuard)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  @ResolveField(() => [Attachment])
  attachments(@Parent() project: Project) {
    return this.projectsService.findAttachments(project.id);
  }

  @ResolveField(() => [Project])
  children(
    @Parent() project: Project,
    @CurrentUser() user: { userId: string },
  ) {
    return this.projectsService.findChildren(project.id, user.userId);
  }

  @ResolveField(() => Project, { nullable: true })
  parent(@Parent() project: Project, @CurrentUser() user: { userId: string }) {
    if (!project.parentId) {
      return null;
    }
    return this.projectsService.findOne(project.parentId, user.userId);
  }

  @ResolveField(() => [List])
  lists(@Parent() project: Project) {
    return this.projectsService.findLists(project.id);
  }

  @ResolveField(() => [Todo])
  todos(@Parent() project: Project) {
    return this.projectsService.findTodos(project.id);
  }

  @ResolveField(() => Int)
  countTodo(
    @Parent() project: Project,
    @CurrentUser() user: { userId: string },
  ) {
    return this.projectsService.countTodos(project.id, user.userId);
  }

  @ResolveField(() => Int)
  completedTodos(@Parent() project: Project) {
    return this.projectsService.countCompletedTodos(project.id);
  }

  @Mutation(() => Project)
  createProject(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateProjectInput,
  ) {
    return this.projectsService.create(user.userId, input);
  }

  @Query(() => [Project], { name: 'projects' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.projectsService.findAll(user.userId);
  }

  @Query(() => Project, { name: 'project', nullable: true })
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.projectsService.findOne(id, user.userId);
  }

  @Query(() => Project, { name: 'projectByCode', nullable: true })
  findByCode(
    @Args('code', { type: () => String }) code: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.projectsService.findByCode(code, user.userId);
  }

  @Mutation(() => Project)
  updateProject(
    @Args('input') input: UpdateProjectInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.projectsService.update(input.id, input, user.userId);
  }

  @Mutation(() => Project)
  removeProject(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.projectsService.remove(id, user.userId);
  }
}
