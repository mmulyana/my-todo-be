import { InputType, Field } from '@nestjs/graphql';
import { GraphQLJSON } from '@/common/scalars/json.scalar';
import type { ProseMirrorDoc } from '@/db/schema';

@InputType()
export class CreateDocumentInput {
  @Field()
  title: string;

  @Field(() => GraphQLJSON, { nullable: true })
  content?: ProseMirrorDoc | null;

  @Field(() => String, { nullable: true })
  projectId?: string | null;
}
