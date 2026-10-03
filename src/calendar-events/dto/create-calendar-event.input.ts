import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateCalendarEventInput {
  @Field(() => String, {
    nullable: true,
    description: 'Defaults to the linked todo title',
  })
  title?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Date)
  startAt: Date;

  @Field(() => Date)
  endAt: Date;

  @Field(() => Boolean, { nullable: true })
  allDay?: boolean | null;

  @Field(() => String, { nullable: true })
  color?: string | null;

  @Field(() => String, { nullable: true })
  todoId?: string | null;
}
