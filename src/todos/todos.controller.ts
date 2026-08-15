import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoFilterInput, TodoView } from './dto/todo-filter.input';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(createTodoDto);
  }

  @Get()
  findAll(
    @Query('view') view?: TodoView,
    @Query('listId') listId?: string,
    @Query('q') q?: string,
    @Query('projectId') projectId?: string,
  ) {
    const filter: TodoFilterInput = { view, listId, q, projectId };
    return this.todosService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.todosService.findOne(id);
  }

  @Post(':id/subtodos')
  createSubtodo(@Param('id') id: string, @Body() body: { title: string }) {
    return this.todosService.create({ title: body.title, parentId: id });
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
