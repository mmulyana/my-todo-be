import { InputType, Field, Int, registerEnumType } from '@nestjs/graphql';

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
  milestoneId?: string;

  @Field(() => String, { nullable: true })
  q?: string;

  @Field(() => String, { nullable: true })
  projectId?: string;

  @Field(() => Boolean, { nullable: true })
  completed?: boolean;

  @Field(() => Int, { nullable: true })
  priority?: number;

  @Field(() => String, {
    nullable: true,
    description:
      'Only todos due on or after this YYYY-MM-DD date. Subtodos are included once a due range is set.',
  })
  dueFrom?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Only todos due on or before this YYYY-MM-DD date.',
  })
  dueTo?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Also return child todos. Only applies to the TODAY view.',
  })
  includeSubtodos?: boolean;

  @Field(() => Int, {
    nullable: true,
    description: 'Max number of todos to return (1-100).',
  })
  limit?: number;
}
