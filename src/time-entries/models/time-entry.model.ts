import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Todo } from '@/todos/models/todo.model';

@ObjectType()
export class TimeEntry {
  @Field(() => ID)
  id: string;

  @Field()
  description: string;

  @Field()
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  endedAt?: Date | null;

  @Field(() => String, { nullable: true })
  todoId?: string | null;

  @Field(() => Todo, { nullable: true })
  todo?: Todo | null;

  @Field(() => Int, {
    description:
      'Duration in seconds, counted up to now while still running',
  })
  duration?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
