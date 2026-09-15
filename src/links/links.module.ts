import { Module } from '@nestjs/common';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { LinksResolver } from './links.resolver';

@Module({
  controllers: [LinksController],
  providers: [LinksService, LinksResolver],
  exports: [LinksService],
})
export class LinksModule {}
