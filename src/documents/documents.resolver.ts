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
import { DocumentsService } from './documents.service';
import { Document } from './models/document.model';
import { CreateDocumentInput } from './dto/create-document.input';
import { UpdateDocumentInput } from './dto/update-document.input';
import { Project } from '@/projects/models/project.model';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Resolver(() => Document)
@UseGuards(JwtAuthGuard)
export class DocumentsResolver {
  constructor(private readonly documentsService: DocumentsService) {}

  @ResolveField(() => Project, { nullable: true })
  project(@Parent() document: Document) {
    if (!document.projectId) {
      return null;
    }
    return this.documentsService.findProject(document.projectId);
  }

  @Query(() => [Document], { name: 'documents' })
  findAll(
    @CurrentUser() user: { userId: string },
    @Args('projectId', { type: () => ID, nullable: true }) projectId?: string,
  ) {
    return this.documentsService.findAll(user.userId, projectId);
  }

  @Query(() => Document, { name: 'document', nullable: true })
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.documentsService.findOne(id, user.userId);
  }

  @Mutation(() => Document)
  createDocument(
    @CurrentUser() user: { userId: string },
    @Args('input') input: CreateDocumentInput,
  ) {
    return this.documentsService.create(user.userId, input);
  }

  @Mutation(() => Document)
  updateDocument(
    @Args('input') input: UpdateDocumentInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.documentsService.update(input.id, input, user.userId);
  }

  @Mutation(() => Document)
  removeDocument(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.documentsService.remove(id, user.userId);
  }
}
