import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() createMilestoneDto: CreateMilestoneDto,
  ) {
    return this.milestonesService.create(user.userId, createMilestoneDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { userId: string },
    @Query('projectId') projectId?: string,
  ) {
    return this.milestonesService.findAll(user.userId, projectId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.milestonesService.findOne(id, user.userId);
  }

  @Get(':id/todos')
  findTodos(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.milestonesService.findTodos(id, user.userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
  ) {
    return this.milestonesService.update(id, updateMilestoneDto, user.userId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.milestonesService.remove(id, user.userId);
  }
}
