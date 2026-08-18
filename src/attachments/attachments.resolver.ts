import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './models/attachment.model';
import { CreateAttachmentInput } from './dto/create-attachment.input';
import { UpdateAttachmentInput } from './dto/update-attachment.input';
import { Todo } from '@/todos/models/todo.model';
import { Project } from '@/projects/models/project.model';
import { TodosService } from '@/todos/todos.service';
import { ProjectsService } from '@/projects/projects.service';

@Resolver(() => Attachment)
export class AttachmentsResolver {
  constructor(
    private readonly attachmentsService: AttachmentsService,
    private readonly todosService: TodosService,
    private readonly projectsService: ProjectsService,
  ) {}

  @ResolveField(() => Todo, { nullable: true })
  todo(@Parent() attachment: Attachment) {
    if (!attachment.todoId) {
      return null;
    }
    return this.todosService.findOne(attachment.todoId);
  }

  @ResolveField(() => Project, { nullable: true })
  project(@Parent() attachment: Attachment) {
    if (!attachment.projectId) {
      return null;
    }
    return this.projectsService.findOne(attachment.projectId);
  }

  @Mutation(() => Attachment)
  createAttachment(@Args('input') input: CreateAttachmentInput) {
    return this.attachmentsService.create(input);
  }

  @Query(() => [Attachment], { name: 'attachments' })
  findAll(
    @Args('todoId', { nullable: true }) todoId?: string,
    @Args('projectId', { nullable: true }) projectId?: string,
  ) {
    return this.attachmentsService.findAll(todoId, projectId);
  }

  @Query(() => Attachment, { name: 'attachment', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.attachmentsService.findOne(id);
  }

  @Mutation(() => Attachment)
  updateAttachment(@Args('input') input: UpdateAttachmentInput) {
    return this.attachmentsService.update(input.id, input);
  }

  @Mutation(() => Attachment)
  removeAttachment(@Args('id', { type: () => ID }) id: string) {
    return this.attachmentsService.remove(id);
  }
}
