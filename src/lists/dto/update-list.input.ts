import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateListInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  projectId?: string | null;
}
