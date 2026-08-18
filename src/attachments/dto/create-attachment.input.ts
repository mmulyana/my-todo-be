import { InputType, Field, Int } from '@nestjs/graphql';
import { AttachmentType } from '../models/attachment.model';

@InputType()
export class CreateAttachmentInput {
  @Field()
  filename: string;

  @Field()
  url: string;

  @Field(() => String, { nullable: true })
  mimeType?: string;

  @Field(() => Int, { nullable: true })
  size?: number;

  @Field(() => AttachmentType, { nullable: true })
  type?: AttachmentType;

  @Field(() => String, { nullable: true })
  todoId?: string | null;

  @Field(() => String, { nullable: true })
  projectId?: string | null;
}
