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
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.projectsService.findByCode(code);
  }

  @Get(':id/children')
  findChildren(@Param('id') id: string) {
    return this.projectsService.findChildren(id);
  }

  @Get(':id/todos/count')
  countTodos(@Param('id') id: string) {
    return this.projectsService.countTodos(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
