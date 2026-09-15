import { Module } from '@nestjs/common';
import { LinksModule } from '@/links/links.module';
import { AttachmentsService } from './attachments.service';
import { AttachmentsResolver } from './attachments.resolver';
import { AttachmentsController } from './attachments.controller';
import { TodosModule } from '@/todos/todos.module';
import { ProjectsModule } from '@/projects/projects.module';

@Module({
  imports: [TodosModule, ProjectsModule, LinksModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, AttachmentsResolver],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
