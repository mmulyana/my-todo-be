import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateProjectInput {
  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  color?: string | null;

  @Field(() => String, { nullable: true })
  code?: string | null;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  parentId?: string | null;

  @Field(() => [String], { nullable: true })
  repos?: string[];

  @Field(() => Float, { nullable: true })
  position?: number;
}
