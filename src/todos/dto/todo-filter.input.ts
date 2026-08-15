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
  // note: falls back to ALL when omitted.
  @Field(() => TodoView, { nullable: true })
  view?: TodoView;

  // note: narrows to one list, on top of `view`.
  @Field(() => String, { nullable: true })
  listId?: string;

  // note: searches title and note across every list, ignoring `view`.
  @Field(() => String, { nullable: true })
  q?: string;

  @Field(() => String, { nullable: true })
  projectId?: string;
}
