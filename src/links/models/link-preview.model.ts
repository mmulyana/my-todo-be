import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class LinkPreview {
  @Field()
  url: string;

  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  image?: string | null;

  @Field(() => String, { nullable: true })
  favicon?: string | null;

  @Field(() => String, { nullable: true })
  siteName?: string | null;
}
