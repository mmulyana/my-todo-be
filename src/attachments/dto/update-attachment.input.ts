import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { AttachmentType } from '../models/attachment.model';

@InputType()
export class UpdateAttachmentInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  filename?: string;

  @Field({ nullable: true })
  url?: string;

  @Field(() => String, { nullable: true })
  mimeType?: string | null;

  @Field(() => Int, { nullable: true })
  size?: number | null;

  @Field(() => AttachmentType, { nullable: true })
  type?: AttachmentType;

  @Field(() => String, { nullable: true })
  todoId?: string | null;

  @Field(() => String, { nullable: true })
  projectId?: string | null;
}
