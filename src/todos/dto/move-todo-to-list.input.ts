import { Field, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class MoveTodoToListInput {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  listId?: string | null;

  @Field(() => Int)
  position: number;
}
