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

@Resolver(() => Project)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  @ResolveField(() => [Attachment])
  attachments(@Parent() project: Project) {
    return this.projectsService.findAttachments(project.id);
  }

  @ResolveField(() => [Project])
  children(@Parent() project: Project) {
    return this.projectsService.findChildren(project.id);
  }

  @ResolveField(() => Project, { nullable: true })
  parent(@Parent() project: Project) {
    if (!project.parentId) {
      return null;
    }
    return this.projectsService.findOne(project.parentId);
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
  countTodo(@Parent() project: Project) {
    return this.projectsService.countTodos(project.id);
  }

  @Mutation(() => Project)
  createProject(@Args('input') input: CreateProjectInput) {
    return this.projectsService.create(input);
  }

  @Query(() => [Project], { name: 'projects' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Query(() => Project, { name: 'project', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.projectsService.findOne(id);
  }

  @Query(() => Project, { name: 'projectByCode', nullable: true })
  findByCode(@Args('code', { type: () => String }) code: string) {
    return this.projectsService.findByCode(code);
  }

  @Mutation(() => Project)
  updateProject(@Args('input') input: UpdateProjectInput) {
    return this.projectsService.update(input.id, input);
  }

  @Mutation(() => Project)
  removeProject(@Args('id', { type: () => ID }) id: string) {
    return this.projectsService.remove(id);
  }
}
