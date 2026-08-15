import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateListInput {
  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  projectId?: string | null;
}
