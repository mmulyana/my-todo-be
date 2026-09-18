import { Field, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class MoveTodoInput {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  kanbanColumnId: string;

  @Field(() => Int)
  position: number;
}
