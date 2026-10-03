import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateTimeEntryInput {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  todoId?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Date, { nullable: true })
  startedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  endedAt?: Date | null;
}
