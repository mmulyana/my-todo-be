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
