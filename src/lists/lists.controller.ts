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
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@Controller('lists')
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() createListDto: CreateListDto,
  ) {
    return this.listsService.create(user.userId, createListDto);
  }

  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.listsService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.listsService.findOne(id, user.userId);
  }

  @Get(':id/todos')
  findTodos(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.listsService.findTodos(id, user.userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updateListDto: UpdateListDto,
  ) {
    return this.listsService.update(id, updateListDto, user.userId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.listsService.remove(id, user.userId);
  }
}
