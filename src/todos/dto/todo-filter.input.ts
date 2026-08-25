import { InputType, Field, registerEnumType } from '@nestjs/graphql';

export enum TodoView {
  TODAY = 'today',
  IMPORTANT = 'important',
  ALL = 'all',
}

registerEnumType(TodoView, {
  name: 'TodoView',
  description: 'Built-in smart lists: TODAY, IMPORTANT, ALL',
});

@InputType()
export class TodoFilterInput {
  @Field(() => TodoView, { nullable: true })
  view?: TodoView;

  @Field(() => String, { nullable: true })
  listId?: string;

  @Field(() => String, { nullable: true })
  q?: string;

  @Field(() => String, { nullable: true })
  projectId?: string;

  @Field(() => Boolean, { nullable: true })
  completed?: boolean;
}
