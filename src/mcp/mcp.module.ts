import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { McpController } from './mcp.controller';
import { McpAuthGuard } from './mcp-auth.guard';
import { TokensModule } from '@/tokens/tokens.module';
import { TodosModule } from '@/todos/todos.module';
import { ListsModule } from '@/lists/lists.module';
import { ProjectsModule } from '@/projects/projects.module';

@Module({
  imports: [
    TokensModule,
    TodosModule,
    ListsModule,
    ProjectsModule,
    JwtModule.register({}),
  ],
  controllers: [McpController],
  providers: [McpAuthGuard],
})
export class McpModule {}
