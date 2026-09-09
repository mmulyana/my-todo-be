import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.userId, createProjectDto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.projectsService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.projectsService.findOne(id, user.userId);
  }

  @Get('code/:code')
  findByCode(
    @CurrentUser() user: { userId: string },
    @Param('code') code: string,
  ) {
    return this.projectsService.findByCode(code, user.userId);
  }

  @Get(':id/children')
  findChildren(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.projectsService.findChildren(id, user.userId);
  }

  @Get(':id/todos/count')
  countTodos(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.projectsService.countTodos(id, user.userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto, user.userId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.projectsService.remove(id, user.userId);
  }
}
