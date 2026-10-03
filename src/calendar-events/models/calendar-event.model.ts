import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Todo } from '@/todos/models/todo.model';

@ObjectType()
export class CalendarEvent {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  startAt: Date;

  @Field({ description: 'Exclusive end time' })
  endAt: Date;

  @Field()
  allDay: boolean;

  @Field(() => String, { nullable: true })
  color?: string | null;

  @Field(() => String, { nullable: true })
  todoId?: string | null;

  @Field(() => Todo, { nullable: true })
  todo?: Todo | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
