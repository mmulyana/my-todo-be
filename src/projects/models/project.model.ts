import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Todo } from '@/todos/models/todo.model';
import { List } from '@/lists/models/list.model';
import { Attachment } from '@/attachments/models/attachment.model';

@ObjectType()
export class Project {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  code?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  parentId?: string | null;

  @Field(() => Project, { nullable: true })
  parent?: Project | null;

  @Field(() => [Project])
  children?: Project[];

  @Field(() => [List])
  lists?: List[];

  @Field(() => [Todo])
  todos?: Todo[];

  @Field(() => [Attachment])
  attachments?: Attachment[];

  @Field(() => Int)
  countTodo?: number;

  @Field(() => Int)
  completedTodos?: number;
}
