import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Project } from '@/projects/models/project.model';
import { GraphQLJSON } from '@/common/scalars/json.scalar';
import type { ProseMirrorDoc } from '@/db/schema';

@ObjectType()
export class Document {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field(() => GraphQLJSON, { nullable: true })
  content?: ProseMirrorDoc | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  projectId?: string | null;

  @Field(() => Project, { nullable: true })
  project?: Project | null;
}
