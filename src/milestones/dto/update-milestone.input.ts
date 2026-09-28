import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateMilestoneInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  dueDate?: string | null;

  @Field(() => String, { nullable: true })
  projectId?: string | null;
}
