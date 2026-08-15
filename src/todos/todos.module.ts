import { Module } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { TodosResolver } from './todos.resolver';

@Module({
  controllers: [TodosController],
  providers: [TodosService, TodosResolver],
})
export class TodosModule {}
