import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { User } from './models/user.model';
import { UsersService } from './users.service';
import { UpdateProfileInput } from './dto/update-profile.input';
import { JwtAuthGuard, CurrentUser } from '@/auth';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { userId: string }) {
    return this.usersService.findById(user.userId);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: { userId: string },
    @Args('input') input: UpdateProfileInput,
  ) {
    return this.usersService.update(user.userId, input);
  }
}
