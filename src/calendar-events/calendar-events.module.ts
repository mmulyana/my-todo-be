import { Module } from '@nestjs/common';
import { CalendarEventsService } from './calendar-events.service';
import { CalendarEventsResolver } from './calendar-events.resolver';

@Module({
  providers: [CalendarEventsService, CalendarEventsResolver],
  exports: [CalendarEventsService],
})
export class CalendarEventsModule {}
