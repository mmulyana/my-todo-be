import { Field, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateKanbanColumnInput {
  @Field(() => ID) projectId: string;
  @Field() name: string;
}

@InputType()
export class UpdateKanbanColumnInput {
  @Field(() => ID) id: string;
  @Field({ nullable: true }) name?: string;
  @Field(() => Int, { nullable: true }) position?: number;
}
