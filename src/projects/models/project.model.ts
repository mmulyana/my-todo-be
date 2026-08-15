import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Todo } from '@/todos/models/todo.model';
import { List } from '@/lists/models/list.model';

@ObjectType()
export class Project {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

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
}
