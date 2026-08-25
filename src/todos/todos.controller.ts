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
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoFilterInput, TodoView } from './dto/todo-filter.input';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() createTodoDto: CreateTodoDto,
  ) {
    return this.todosService.create(user.userId, createTodoDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { userId: string },
    @Query('view') view?: TodoView,
    @Query('listId') listId?: string,
    @Query('q') q?: string,
    @Query('projectId') projectId?: string,
    @Query('completed') completed?: string,
  ) {
    const filter: TodoFilterInput = {
      view,
      listId,
      q,
      projectId,
      completed: completed === undefined ? undefined : completed === 'true',
    };
    return this.todosService.findAll(user.userId, filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todosService.findOne(id);
  }

  @Post(':id/subtodos')
  createSubtodo(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: { title: string },
  ) {
    return this.todosService.create(user.userId, {
      title: body.title,
      parentId: id,
    });
  }

  @Get(':id/subtodos')
  findSubtodos(@Param('id') id: string) {
    return this.todosService.findSubtodos(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    return this.todosService.update(id, updateTodoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todosService.remove(id);
  }
}
