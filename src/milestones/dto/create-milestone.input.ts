import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateMilestoneInput {
  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  dueDate?: string | null;

  @Field(() => String, { nullable: true })
  projectId?: string | null;
}
