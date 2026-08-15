import { Module } from '@nestjs/common';
import { ListsService } from './lists.service';
import { ListsController } from './lists.controller';
import { ListsResolver } from './lists.resolver';

@Module({
  controllers: [ListsController],
  providers: [ListsService, ListsResolver],
})
export class ListsModule {}
