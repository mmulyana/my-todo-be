import { Module } from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { MilestonesController } from './milestones.controller';
import { MilestonesResolver } from './milestones.resolver';

@Module({
  controllers: [MilestonesController],
  providers: [MilestonesService, MilestonesResolver],
  exports: [MilestonesService],
})
export class MilestonesModule {}
