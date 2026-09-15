import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { Todo } from '@/todos/models/todo.model';
import { Project } from '@/projects/models/project.model';

export enum AttachmentType {
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  LINK = 'LINK',
}

registerEnumType(AttachmentType, {
  name: 'AttachmentType',
  description: 'Type of attachment: IMAGE, FILE, or LINK',
});

@ObjectType()
export class Attachment {
  @Field(() => ID)
  id: string;

  @Field()
  filename: string;

  @Field()
  url: string;

  @Field(() => String, { nullable: true })
  mimeType?: string | null;

  @Field(() => Int, { nullable: true })
  size?: number | null;

  @Field(() => AttachmentType)
  type: AttachmentType;

  /** note: Link preview metadata, filled server-side when a LINK is saved. */
  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  image?: string | null;

  @Field(() => String, { nullable: true })
  favicon?: string | null;

  @Field(() => String, { nullable: true })
  siteName?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  todoId?: string | null;

  @Field(() => Todo, { nullable: true })
  todo?: Todo | null;

  @Field(() => String, { nullable: true })
  projectId?: string | null;

  @Field(() => Project, { nullable: true })
  project?: Project | null;
}
