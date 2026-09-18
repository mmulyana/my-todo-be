import { InputType, Field, ID, Int } from '@nestjs/graphql';

@InputType()
export class UpdateTodoInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  note?: string;

  @Field({ nullable: true })
  completed?: boolean;

  @Field({ nullable: true })
  important?: boolean;

  @Field(() => Int, { nullable: true })
  priority?: number | null;

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
}
