import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Project } from '@/projects/models/project.model';
import { List } from '@/lists/models/list.model';
import { Attachment } from '@/attachments/models/attachment.model';

@ObjectType()
export class Todo {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  note: string;

  @Field()
  completed: boolean;

  @Field()
  important: boolean;

  @Field(() => Int)
  priority: number;

  @Field(() => ID, { nullable: true })
  kanbanColumnId?: string | null;

  @Field(() => Int)
  position: number;

  @Field(() => Int)
  listPosition: number;

  @Field(() => String, { nullable: true })
  today?: string | null;

  @Field(() => String, { nullable: true })
  dueDate?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  parentId?: string | null;

  @Field(() => Todo, { nullable: true })
  parent?: Todo | null;

  @Field(() => [Todo])
  subtodos?: Todo[];

  @Field(() => Int)
  subtodoCount?: number;

  @Field(() => Int)
  completedTodos?: number;

  @Field(() => String, { nullable: true })
  listId?: string | null;

  @Field(() => List, { nullable: true })
  list?: List | null;

  @Field(() => String, { nullable: true })
  projectId?: string | null;

  @Field(() => Project, { nullable: true })
  project?: Project | null;

  @Field(() => [Attachment])
  attachments?: Attachment[];
}
