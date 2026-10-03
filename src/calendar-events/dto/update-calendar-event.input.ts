import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateCalendarEventInput {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Date, { nullable: true })
  startAt?: Date | null;

  @Field(() => Date, { nullable: true })
  endAt?: Date | null;

  @Field(() => Boolean, { nullable: true })
  allDay?: boolean | null;

  @Field(() => String, { nullable: true })
  color?: string | null;

  @Field(() => String, { nullable: true })
  todoId?: string | null;
}
