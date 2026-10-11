import { InputType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from '@/common/scalars/json.scalar';
import type { ProseMirrorDoc } from '@/db/schema';

@InputType()
export class CreateTodoInput {
  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  note?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  noteJson?: ProseMirrorDoc | null;

  @Field(() => Boolean, { nullable: true })
  important?: boolean;

  @Field(() => Int, { nullable: true })
  priority?: number;

  @Field(() => String, { nullable: true })
  today?: string | null;

  @Field(() => String, { nullable: true })
  dueDate?: string | null;

  @Field(() => String, { nullable: true })
  parentId?: string | null;

  @Field(() => String, { nullable: true })
  listId?: string | null;

  @Field(() => String, { nullable: true })
  projectId?: string | null;

  @Field(() => String, { nullable: true })
  milestoneId?: string | null;

  @Field(() => String, { nullable: true })
  assignee?: string | null;

  @Field(() => String, { nullable: true })
  repo?: string | null;
}
