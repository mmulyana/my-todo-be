import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class KanbanColumn {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field(() => Int) position: number;
  @Field(() => String) projectId: string;
}
