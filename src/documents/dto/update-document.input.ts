import { InputType, Field, ID } from '@nestjs/graphql';
import { GraphQLJSON } from '@/common/scalars/json.scalar';
import type { ProseMirrorDoc } from '@/db/schema';

@InputType()
export class UpdateDocumentInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  title?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  content?: ProseMirrorDoc | null;

  @Field(() => String, { nullable: true })
  projectId?: string | null;
}
