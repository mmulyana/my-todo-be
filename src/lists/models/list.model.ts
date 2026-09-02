import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Todo } from '@/todos/models/todo.model';
import { Project } from '@/projects/models/project.model';

@ObjectType()
export class List {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  projectId?: string | null;

  @Field(() => Project, { nullable: true })
  project?: Project | null;

  @Field(() => [Todo])
  todos?: Todo[];

  @Field(() => Int)
  totalTodo?: number;

  @Field(() => Int)
  completedTodos?: number;
}
