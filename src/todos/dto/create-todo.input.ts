import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateTodoInput {
  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  note?: string;

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
}
