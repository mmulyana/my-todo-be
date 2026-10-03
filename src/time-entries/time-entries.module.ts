import { Module } from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { TimeEntriesResolver } from './time-entries.resolver';

@Module({
  providers: [TimeEntriesService, TimeEntriesResolver],
  exports: [TimeEntriesService],
})
export class TimeEntriesModule {}
