import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class StartTimeEntryInput {
  @Field(() => String, { nullable: true })
  todoId?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;
}
