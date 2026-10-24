import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field(() => String, { nullable: true })
  displayName?: string | null;

  @Field(() => String, { nullable: true })
  avatarUrl?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
